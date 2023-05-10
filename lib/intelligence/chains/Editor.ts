import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const GUIDANCE = `
Provided the following text:
{context}

And using this as your guide: {objective}

Rewrite the provided text: you may add, remove, or change the sections and headings as you see fit.
Use Github Flavored Markdown (GFM) to format your response. Never use HTML.
The revised text should include sources from the provided text, but you should never make up a url or link.
`;

interface EditorInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Editor extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: EditorInput): Editor {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Editor({
            llm: model,
            callbacks: callbacks,
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