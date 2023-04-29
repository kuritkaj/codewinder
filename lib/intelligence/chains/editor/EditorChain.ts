import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { GUIDANCE } from "@/lib/intelligence/chains/editor/prompts";
import { Callbacks } from "langchain/callbacks";

interface EditorChainInput {
    model: BaseChatModel;
    callbacks?: Callbacks;
}

export class EditorChain extends LLMChain {

    get inputKeys(): string[] {
        return ["context"];
    }

    get outputKeys(): string[] {
        return ["response"];
    }

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain(inputs: EditorChainInput): EditorChain {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new EditorChain({
            llm: inputs.model,
            callbacks: inputs.callbacks,
            prompt
        });
    }

    async evaluate({context, objective}: { context: string; objective: string }) {
        const summary = await this.call({
            context,
            objective
        });
        return summary.response;
    }
}