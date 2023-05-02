import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { Callbacks } from "langchain/callbacks";

export const GUIDANCE = `
Rewrite the following:
{context}

Using this as your guide: {objective}
`;

interface EditorChainInput {
    model: BaseChatModel;
    callbacks?: Callbacks;
}

export class Editor extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain(inputs: EditorChainInput): Editor {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Editor({
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
        return summary.text;
    }
}