import { GuardChain, GuardChainInput } from "@/lib/intelligence/chains/GuardChain";
import { BaseLanguageModel } from "langchain/base_language";
import { Callbacks } from "langchain/callbacks";
import { PromptTemplate } from "langchain/prompts";

export const CONTEXT_INPUT = "context";
export const OBJECTIVE_INPUT = "objective";

export const GUIDANCE = `
This was the initial objective: 
\"\"\"{${OBJECTIVE_INPUT}}\"\"\"

And the following text is intended to resolve this objective:
\"\"\"{${CONTEXT_INPUT}}\"\"\"

Based on the provided text, write a response which meets the initial objective.
Use CommonMark to format the response (plus markdown tables).
The revised text can optionally include inline sources from the provided text, but you should never make up a url or link.`;

interface EditorInput {
    callbacks?: Callbacks;
    model: BaseLanguageModel;
}

export class Editor extends GuardChain {

    constructor(input: GuardChainInput) {
        super(input);
    }

    public static makeChain({model, callbacks}: EditorInput): Editor {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Editor({
            llm: model,
            callbacks: callbacks,
            prompt: prompt
        });
    }

    public async predict({context, objective}: { context: string; objective: string }): Promise<string> {
        return await super.predict({
            context,
            objective
        });
    }
}