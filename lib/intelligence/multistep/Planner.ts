import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/dist/base_language";

export const GUIDANCE = `
This is provided input for the planner: 
{input}

Rewrite the provided input: you may add, remove, or change the steps as you see fit.

When responding, ALWAYS use JSON and include the original objective and the updated tasks.

ALWAYS respond using this format:
\`\`\`
{{
    "objective": "objective",
    "step": [
        "step 1 + context from the objective",
        "step 2 + context from the objective"
    ]
}}
\`\`\`
   (each step won't have access to the objective, so the context from the objective should be included in each step)
   (the response should only contain a SINGLE objective, do NOT return a list of multiple objectives)
`;

interface PlannerInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Planner extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: PlannerInput): Planner {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Planner({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    async evaluate({input}: { input: string }) {
        const summary = await this.call({
            input
        });
        return summary.text;
    }
}