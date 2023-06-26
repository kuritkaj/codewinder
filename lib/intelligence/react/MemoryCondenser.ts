import { GuardChain, GuardChainInput } from "@/lib/intelligence/chains/GuardChain";
import { BaseLanguageModel } from "langchain/base_language";
import { Callbacks } from "langchain/callbacks";
import { PromptTemplate } from "langchain/prompts";

export const RESPONSE_INPUT = "response";
export const ACTIONS_INPUT = "actions";

export const GUIDANCE = `You are an AI assistant responsible for documenting the sequence of actions taken towards a particular objective.

Here is the history of past actions and experiences to achieve an objective:
\"\"\"{${ACTIONS_INPUT}}\"\"\"

Based on these past actions and experiences, the AI responded with: 
\"\"\"{${RESPONSE_INPUT}}\"\"\"

Based on the provided history and AI response, now respond using the following format:
Objective: the derived objective phrased as a question or directive for later recall
Guidance: based on the provided actions and the response, briefly share guidance on how the AI Assistant can improve the outcomes next time?
...(note: it's okay to also say no additional changes are needed)`;

interface CondenserInput {
    callbacks?: Callbacks;
    model: BaseLanguageModel;
}

export class MemoryCondenser extends GuardChain {

    constructor(input: GuardChainInput) {
        super(input);
    }

    public static makeChain({model, callbacks}: CondenserInput): MemoryCondenser {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new MemoryCondenser({
            llm: model,
            callbacks: callbacks,
            prompt: prompt
        });
    }

    public async predict({actions, response}: { actions: string; response: string; }): Promise<string> {
        return await super.predict({
            actions,
            response
        });
    }
}