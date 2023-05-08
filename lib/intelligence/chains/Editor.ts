import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const GUIDANCE = `
Rewrite the following:
{context}

Using this as your guide: {goal}
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

    async evaluate({context, goal}: { context: string; goal: string }) {
        const summary = await this.call({
            context,
            goal
        });
        return summary.text;
    }
}