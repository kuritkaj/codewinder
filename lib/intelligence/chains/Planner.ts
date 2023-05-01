import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { Callbacks } from "langchain/callbacks";

export const GUIDANCE = `
This is the objective: {objective}
And these are the steps to achieve it: {steps}

Rewrite the provided steps: you may add, remove, or change the steps as you see fit.

When responding, ALWAYS use JSON and include the original objective and the updated steps.

ALWAYS respond using this format:
\`\`\`
{{
    "objective": "objective",
    "steps": [
        "step or task 1",
        "step or task 2"
    ]
}}
\`\`\`
`;

interface PlannerChainInput {
    model: BaseChatModel;
    callbacks?: Callbacks;
}

export class Planner extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain(inputs: PlannerChainInput): Planner {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Planner({
            llm: inputs.model,
            callbacks: inputs.callbacks,
            prompt
        });
    }

    async evaluate({objective, steps}: { objective: string, steps: string }) {
        const summary = await this.call({
            objective,
            steps
        });
        return summary.text;
    }
}