import { Tool, ToolParams } from "langchain/tools";
import { Callbacks } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { CallbackManagerForToolRun } from "langchain/dist/callbacks/manager";
import { Editor } from "@/lib/intelligence/chains/Editor";
import { OBJECTIVE_INPUT, ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { Planner } from "@/lib/intelligence/chains/Planner";
import { BaseLanguageModel } from "langchain/base_language";
import { ReActExecutor } from "@/lib/intelligence/react/ReActExecutor";

const NAME = "multi-step";
const DESCRIPTION = `for complex objectives that have multiple steps or tasks or objectives that have more than one part.
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

interface MultistepToolParams extends ToolParams {
    creative: BaseLanguageModel;
    model: BaseLanguageModel;
    tools: Tool[];
    maxIterations?: number;
    memory: MemoryStore;
}

export class Multistep extends Tool {
    readonly name = NAME;
    readonly description = DESCRIPTION;

    private readonly creative: BaseLanguageModel;
    private readonly maxIterations?: number;
    private readonly memory: MemoryStore;
    private readonly model: BaseLanguageModel;
    private readonly tools: Tool[];

    constructor({ model, creative, memory, tools, maxIterations, verbose, callbacks }: MultistepToolParams) {
        super(verbose, callbacks);

        this.creative = creative;
        this.maxIterations = maxIterations;
        this.memory = memory;
        this.model = model;
        this.tools = tools;
    }

    async _call(input: string, callbackManager?: CallbackManagerForToolRun): Promise<string> {
        return await Multistep.runAgent(this.model, this.creative, this.memory, this.tools, this.callbacks, this.verbose, this.maxIterations, input, callbackManager);
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
        const executor = ReActExecutor.fromAgentAndTools({
            agent,
            tools,
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
