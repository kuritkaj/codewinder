import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models";
import { Callbacks } from "langchain/callbacks";

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

    async evaluate({goal, tasks}: { goal: string, tasks: string }) {
        const summary = await this.call({
            goal,
            tasks
        });
        return summary.text;
    }
}