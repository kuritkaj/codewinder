import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { Editor } from "@/lib/intelligence/multistep/Editor";
import { CONTEXT_INPUT, ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { ReActExecutor } from "@/lib/intelligence/react/ReActExecutor";
import { CallbackManagerForChainRun } from "langchain/callbacks";
import { BaseChain, SerializedLLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { ChainValues } from "langchain/schema";
import { StructuredTool } from "langchain/tools";

export const OBJECTIVE_INPUT = "objective";
export const OUTPUT_KEY = "output";
export const STEPS_INPUT = "steps";

interface MultistepExecutorInput {
    callbacks: Callbacks;
    creative: ChatOpenAI;
    predictable: ChatOpenAI;
    store: MemoryStore;
    tools: StructuredTool[];
    verbose: boolean;
}

export class MultistepExecutor extends BaseChain {

    private readonly creative: ChatOpenAI;
    private readonly predictable: ChatOpenAI;
    private readonly store: MemoryStore;
    private readonly tools: StructuredTool[];

    constructor({callbacks, creative, predictable, store, tools, verbose}: MultistepExecutorInput) {
        super({callbacks, verbose});

        this.creative = creative;
        this.store = store;
        this.predictable = predictable;
        this.tools = tools;
    }

    get inputKeys() {
        return [OBJECTIVE_INPUT, STEPS_INPUT];
    }

    get outputKeys() {
        return [OUTPUT_KEY];
    }

    public async _call(
        inputs: ChainValues,
        runManager?: CallbackManagerForChainRun
    ): Promise<ChainValues> {
        const agent = ReActAgent.fromLLMAndTools({
            callbacks: runManager?.getChild(),
            model: this.predictable,
            store: this.store,
            tools: this.tools,
            verbose: true,
        });
        const executor = ReActExecutor.fromAgentAndTools({
            agent,
            callbacks: runManager.getChild(),
            tools: this.tools,
            verbose: true,
        });

        const objective = inputs[OBJECTIVE_INPUT];
        const steps = inputs[STEPS_INPUT];

        let results = [];
        for (const step of steps) {
            await runManager?.handleText("Starting: " + step.plan);

            const context = step.dependency && step.dependency > 0 && step.dependency <= results.length ? results[step.dependency - 1] : "";
            const plan = `Your task is to \"\"\"${step.plan}\"\"\" ` +
                `which is one task of several to \"\"\"${objective}\"\"\". ` +
                `Only complete your assigned task and no more.`;

            let stepInputs = {};
            stepInputs[CONTEXT_INPUT] = context;
            stepInputs[OBJECTIVE_INPUT] = plan;

            const completion = await executor.predict(stepInputs);
            if (completion) results.push(completion);
        }

        const editor = Editor.makeChain({model: this.creative, callbacks: runManager?.getChild()});
        const completion = await editor.predict({
            context: results.join("\n\n"),
            objective
        });

        return {
            [OUTPUT_KEY]: completion
        }
    }

    public _chainType() {
        return "multistep_executor" as const;
    }

    public async predict(values: ChainValues, callbacks?: Callbacks): Promise<string> {
        const completion = await this.call(values, callbacks);
        return completion[OUTPUT_KEY];
    }

    public serialize(): SerializedLLMChain {
        throw new Error("Cannot serialize an MultistepExecutor");
    }
}
