import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/dist/base_language";

export const GUIDANCE = `
This is the goal: {goal}
And these are the tasks to achieve it: {tasks}

Rewrite the provided tasks: you may add, remove, or change the tasks as you see fit.

When responding, ALWAYS use JSON and include the original objective and the updated tasks.

ALWAYS respond using this format:
\`\`\`
{{
    "goal": "goal",
    "tasks": [
        "task 1",
        "task 2"
    ]
}}
\`\`\`
... (the response should only contain a SINGLE objective, do NOT return a list of multiple objectives)
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

    async evaluate({goal, tasks}: { goal: string, tasks: string }) {
        const summary = await this.call({
            goal,
            tasks
        });
        return summary.text;
    }
}