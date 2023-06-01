import {Tool, ToolParams} from "langchain/tools";
import {CallbackManagerForToolRun} from "langchain/dist/callbacks/manager";
import {Editor} from "@/lib/intelligence/multistep/Editor";
import {CONTEXT_INPUT, OBJECTIVE_INPUT, ReActAgent} from "@/lib/intelligence/react/ReActAgent";
import {Planner} from "@/lib/intelligence/multistep/Planner";
import {BaseLanguageModel} from "langchain/base_language";
import {ReActExecutor} from "@/lib/intelligence/react/ReActExecutor";
import {MemoryStore} from "@/lib/intelligence/memory/MemoryStore";

export const NAME = "multi-step";
export const DESCRIPTION = `for complex objectives that require multiple steps or tasks to complete.
Input format:
{{
  "action": "${NAME}",
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

    constructor({model, creative, memory, tools, maxIterations, verbose, callbacks}: MultistepParams) {
        super(verbose, callbacks);

        this.creative = creative;
        this.maxIterations = maxIterations;
        this.memory = memory;
        this.model = model;
        this.returnDirect = true;
        this.tools = tools;
    }

    async _call(input: string, callbackManager?: CallbackManagerForToolRun): Promise<string> {
        return await MultistepExecutor.runAgent({
            callbackManager: callbackManager,
            creative: this.creative,
            input: input,
            maxIterations: this.maxIterations,
            memory: this.memory,
            model: this.model,
            tools: this.tools
        });
    }

    static async runAgent({callbackManager, creative, input, model, maxIterations, memory, tools}: {
        callbackManager?: CallbackManagerForToolRun,
        creative: BaseLanguageModel,
        input: string,
        model: BaseLanguageModel,
        maxIterations: number,
        memory: MemoryStore,
        tools: Tool[],
    }): Promise<string> {
        const agent = ReActAgent.makeAgent({creative, maxIterations, memory, model, tools});
        const executor = ReActExecutor.fromAgentAndTools({
            agent,
            creative,
            maxIterations,
            memory,
            model,
            tools
        });

        const planner = Planner.makeChain({model: creative});
        const interim = await planner.evaluate({
            input
        });
        const plan = JSON.parse(interim);
        const objective = plan.objective;

        let results = [];
        for (const step of plan.steps) {
            await callbackManager?.handleText("Starting: " + step);

            let inputs = {};
            inputs[OBJECTIVE_INPUT] = `${step}`
            if (results.length > 0) inputs[CONTEXT_INPUT] = results[results.length - 1]

            const completion = await executor.call(inputs);
            results.push(completion.output);
        }

        const editor = Editor.makeChain({model: creative});
        return await editor.evaluate({
            context: results.join("\n\n"),
            objective
        });
    }
}
