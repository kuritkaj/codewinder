import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { ChainValues } from "langchain/schema";
import { CallbackManagerForChainRun, Callbacks } from "langchain/callbacks";

export const ELABORATION_REQUIRED = "NO";
export const OBJECTIVE_INPUT = "objective";
export const RESPONSE_INPUT = "response";

export const GUIDANCE = `
This is the stated objective: {${OBJECTIVE_INPUT}}
This was the resulting response: 
{${RESPONSE_INPUT}}

You are a critic designed to evaluate the quality of a response to the stated objective.
Based on the provided response, respond with \`YES\` if the response meets the stated objective, 
or \`${ELABORATION_REQUIRED}\` if the work is insufficient or incomplete. 
If the response is asking for clarification or more information, then always respond with \`YES\`.

If you respond with \`${ELABORATION_REQUIRED}\`, provide guidance that will help provide a better response next time.
`;

interface EditorChainInput {
    model: BaseChatModel;
    callbacks?: Callbacks;
}

export class Critic extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain(inputs: EditorChainInput): Critic {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Critic({
            llm: inputs.model,
            callbacks: inputs.callbacks,
            prompt
        });
    }

    _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
        return super._call(values, runManager);
    }

    async evaluate({product, objective}: { product: string; objective: string }): Promise<string> {
        const summary = await this.call({
            product,
            objective
        });
        return summary.text;
    }
}