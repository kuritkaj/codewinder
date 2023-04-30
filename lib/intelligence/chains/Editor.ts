import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { Callbacks } from "langchain/callbacks";

export const GUIDANCE = `
This was the response:
{context}

Based on this stated objective: {objective}

Fix any typos and grammar, as well as spacing and formatting, while preserving as much detail as possible.
You can use markdown in your response.
Do not editorialize or add any new information, just fix the errors.
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