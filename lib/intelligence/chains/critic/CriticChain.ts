import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { GUIDANCE } from "@/lib/intelligence/chains/editor/prompts";
import { ChainValues } from "langchain/schema";
import { CallbackManagerForChainRun, Callbacks } from "langchain/callbacks";

interface EditorChainInput {
    model: BaseChatModel;
    callbacks?: Callbacks;
}

export class CriticChain extends LLMChain {

    get inputKeys(): string[] {
        return ["context"];
    }

    get outputKeys(): string[] {
        return ["response"];
    }

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain(inputs: EditorChainInput): CriticChain {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new CriticChain({
            llm: inputs.model,
            callbacks: inputs.callbacks,
            prompt
        });
    }

    _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
        return super._call(values, runManager);
    }

    async evaluate({context}: { context: string }) {
        const summary = await this.call({
            context
        });
        return summary.response;
    }
}