import { Tool } from "langchain/tools";
import { BaseChatModel } from "langchain/chat_models";
import { AgentExecutor } from "langchain/agents";
import { Callbacks } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { CallbackManagerForToolRun } from "langchain/dist/callbacks/manager";
import { EditorChain } from "@/lib/intelligence/chains/editor/EditorChain";
import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";

const DESCRIPTION = `
Always use this tool if the objective is to execute a series of tasks, a document with multiple parts, or a series of steps.
This tool can especially be useful if the request is more than one sentence, or uses terms such as then, next, after, etc.
When using this tool ensure you use JSON and pass the objective and the steps in natural language to achieve the objective.

The tool input should use this format:
{{
  "action": "tool name",
  "action_input": {{
        "objective": "objective",
        "steps": [
            "step or task 1",
            "step or task 2"
        ]
    }}
}}

`;

interface MultistepToolInput {
    creative: BaseChatModel;
    model: BaseChatModel;
    tools: Tool[];
    maxIterations?: number;
    memory: MemoryStore;
    verbose?: boolean;
    callbacks?: Callbacks;
}

export class MultistepTool extends Tool {
    name = "multi-step";

    description = DESCRIPTION;

    creative: BaseChatModel;
    maxIterations?: number;
    memory: MemoryStore;
    model: BaseChatModel;
    returnDirect = false;
    tools: Tool[];

    constructor(options: MultistepToolInput) {
        super(options.verbose, options.callbacks);

        this.creative = options.creative;
        this.maxIterations = options?.maxIterations;
        this.memory = options.memory;
        this.model = options.model;
        this.tools = options.tools;
    }

    async _call(input: string, callbackManager?: CallbackManagerForToolRun): Promise<string> {
        return await MultistepTool.runAgent(this.model, this.creative, this.memory, this.tools, this.callbacks, this.verbose, this.maxIterations || 8, JSON.parse(input), callbackManager);
    }

    static async runAgent(
        model: BaseChatModel, creative: BaseChatModel, memory: MemoryStore, tools: Tool[], callbacks: Callbacks, verbose: boolean, maxIterations: number, plan: {
            objective: string;
            steps: string[];
        }, callbackManager?: CallbackManagerForToolRun): Promise<string> {
        const agent = ReActAgent.makeAgent(model, memory, tools, callbacks);

        const executor = AgentExecutor.fromAgentAndTools({
            agent,
            tools,
            verbose,
            callbacks,
            maxIterations
        });

        let results = [];
        for (const step of plan.steps) {
            await callbackManager?.handleText("Starting step: " + step);
            const completion = await executor.call({
                context: results.length > 0 ? results[results.length - 1] : "",
                objective: `${step} - supporting this overall goal: ${plan.objective}`
            });
            results.push(completion.output);
        }

        const editor = EditorChain.makeChain({model: creative, callbacks});
        return editor.evaluate({
            context: results.join("\n\n"),
            objective: plan.objective
        });
    }
}
