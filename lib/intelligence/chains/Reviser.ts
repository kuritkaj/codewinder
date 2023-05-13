import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/dist/base_language";

export const OBJECTIVE_INPUT = "objective";

export const GUIDANCE = `
You are an AI assistant with the responsibility to improve on a stated objective.

This is the stated objective: {${OBJECTIVE_INPUT}}

Rewrite the stated objective to be more specific and detailed without changing the meaning or intent.
Do not rewrite entities that you don't understand. They're likely for a subject that you don't know about.
If no improvements are necessary, then reply with the provided stated objective.
For example, simple greetings or statements of fact do not need to be improved.
`;

interface ReviserInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Reviser extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: ReviserInput): Reviser {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Reviser({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    async evaluate({objective}: { objective: string }): Promise<string> {
        const summary = await this.call({
            objective
        });
        return summary.text;
    }
}