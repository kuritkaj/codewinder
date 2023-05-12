import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const ELABORATION_REQUIRED = "ELABORATION_REQUIRED";
export const OBJECTIVE_INPUT = "objective";
export const RESPONSE_INPUT = "response";

export const GUIDANCE = `
You are a critic designed to evaluate the quality of a response to the stated objective.

This is the stated objective: {${OBJECTIVE_INPUT}}
This was the resulting response: 
{${RESPONSE_INPUT}}

Based on the provided response, respond with \`YES\` if the response meets the stated objective, 
or \`${ELABORATION_REQUIRED}\` if the work is insufficient or incomplete. 
If the response is asking for clarification or more information, then always respond with \`YES\`.

If you respond with \`${ELABORATION_REQUIRED}\`, provide guidance that will help provide a better response next time.
`;

interface CriticInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Critic extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: CriticInput): Critic {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Critic({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    async evaluate({objective, response}: { objective: string; response: string; }): Promise<string> {
        const summary = await this.call({
            objective,
            response
        });
        return summary.text;
    }
}