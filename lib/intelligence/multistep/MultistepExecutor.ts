import { Tool, ToolParams } from "langchain/tools";
import { Callbacks } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { CallbackManagerForToolRun } from "langchain/dist/callbacks/manager";
import { Editor } from "@/lib/intelligence/multistep/Editor";
import { CONTEXT_INPUT, OBJECTIVE_INPUT, ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { Planner } from "@/lib/intelligence/multistep/Planner";
import { BaseLanguageModel } from "langchain/base_language";
import { ReActExecutor } from "@/lib/intelligence/react/ReActExecutor";

export const NAME = "multi-step";
export const DESCRIPTION = `for complex objectives that require multiple steps or tasks to complete.
Input format:
{{
  "action": "${ NAME }",
  "action_input": {{
        "objective": "the objective with specifics from previous actions",
        "steps": [
            "step 1",
            "step 2"
        ]
    }}
}}`;

interface MultistepParams extends ToolParams {
    creative: BaseLanguageModel;
    model: BaseLanguageModel;
    tools: Tool[];
    maxIterations?: number;
    memory: MemoryStore;
}

export class MultistepExecutor extends Tool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;

    private readonly creative: BaseLanguageModel;
    private readonly maxIterations?: number;
    private readonly memory: MemoryStore;
    private readonly model: BaseLanguageModel;
    private readonly tools: Tool[];

    constructor({ model, creative, memory, tools, maxIterations, verbose, callbacks }: MultistepParams) {
        super(verbose, callbacks);

        this.creative = creative;
        this.maxIterations = maxIterations;
        this.memory = memory;
        this.model = model;
        this.returnDirect = true;
        this.tools = tools;
    }

    async _call(input: string, callbackManager?: CallbackManagerForToolRun): Promise<string> {
        return await MultistepExecutor.runAgent(this.model, this.creative, this.memory, this.tools, this.callbacks, this.verbose, this.maxIterations, input, callbackManager);
    }

    static async runAgent(
        model: BaseLanguageModel,
        creative: BaseLanguageModel,
        memory: MemoryStore,
        tools: Tool[],
        callbacks: Callbacks,
        verbose: boolean,
        maxIterations: number,
        input: string,
        callbackManager?: CallbackManagerForToolRun
    ): Promise<string> {
        const agent = ReActAgent.makeAgent({ model, creative, memory, tools, callbacks, maxIterations });
        const toolset = [...tools, this as unknown as Tool];
        const executor = ReActExecutor.fromAgentAndTools({
            agent,
            tools: toolset,
            verbose,
            callbacks,
            maxIterations
        });

        const planner = Planner.makeChain({ model: creative, callbacks });
        const interim = await planner.evaluate({
            input
        });
        const plan = JSON.parse(interim);
        const objective = plan.objective;

        let results = [];
        for (const step of plan.steps) {
            await callbackManager?.handleText("Starting: " + step);

            let inputs = {};
            inputs[OBJECTIVE_INPUT] = `${ step }`
            if (results.length > 0) inputs[CONTEXT_INPUT] = results[results.length - 1]

            const completion = await executor.call(inputs);
            results.push(completion.output);
        }

        const editor = Editor.makeChain({ model: creative, callbacks });
        return await editor.evaluate({
            context: results.join("\n\n"),
            objective
        });
    }
}
