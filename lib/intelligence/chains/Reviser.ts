import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/dist/base_language";

export const OBJECTIVE_INPUT = "objective";

export const GUIDANCE = `
You are an AI assistant with the responsibility to improve on a stated objective without changing the meaning or intent.

This is the stated objective: {${OBJECTIVE_INPUT}}

Notes:
* Do not rewrite entities and acronyms including proper nouns.
* If no improvements are necessary, then reply with the provided stated objective.
* For example, simple greetings or statements of fact do not need to be improved.
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