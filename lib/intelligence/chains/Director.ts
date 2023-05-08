import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const FINAL_RESPONSE = "Final Response";
export const OBJECTIVE = "Objective";
export const OBJECTIVE_INPUT = "objective";
export const THOUGHT = "Thought";
export const TOOLING_INPUT = "tooling";

export const GUIDANCE = `
You are an AI assistant with the responsibility to determine if a stated objective can be easily responded to - or if it requires further research or is a multi-part problem.

Here is the stated ${OBJECTIVE}:
{${OBJECTIVE_INPUT}}

If the ${OBJECTIVE} can be easily responded to, such as a simple greeting, a joke, or a brief creative work, then reply with \`${FINAL_RESPONSE}:\` followed by your response.
If the previous conversation or provided memory provide a sufficient response to the ${OBJECTIVE}, then reply with \`${FINAL_RESPONSE}:\` followed by your response.

Otherwise, no need to respond.
`;

interface DirectorInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Director extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: DirectorInput): Director {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Director({
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