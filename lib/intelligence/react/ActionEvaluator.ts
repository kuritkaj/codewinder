import { FunctionChain, FunctionChainInput } from "@/lib/intelligence/chains/FunctionChain";
import { Callbacks } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { BaseChatMessage } from "langchain/schema";
import { StructuredTool } from "langchain/tools";

export const OBJECTIVE_INPUT = "objective";
export const ACTION_INPUT = "action";
export const STEPS_INPUT = "steps";

export const GUIDANCE = `An AI assistant is helping a user achieve this specific objective: 
{${OBJECTIVE_INPUT}}

Here is the history of past actions: 
\`\`\`
{${STEPS_INPUT}}
\`\`\`

Based on these past actions, the AI has now responded with: 
\`\`\`
{${ACTION_INPUT}}
\`\`\`

Evaluate the response based on the following criteria:
* Does the action meet the stated objective based on the past actions?
* Is the action starting to go on a tangent or starting to drift from the original objective?
* Is the action repeating a previous past action?
* Tools cannot see past actions and experiences, does the tool input need to be clarified?

Be very brief in your response, request a new function or update the function input as needed.`;

export interface ActionEvaluatorInput {
    callbacks?: Callbacks;
    llm: ChatOpenAI;
    tools: StructuredTool[];
}

export class ActionEvaluator extends FunctionChain {

    constructor(input: FunctionChainInput) {
        super(input);
    }

    public static makeChain({callbacks, llm, tools}: ActionEvaluatorInput): ActionEvaluator {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new ActionEvaluator({
            llm,
            callbacks,
            prompt,
            tools
        });
    }

    public async predict({objective, action, steps}: {
        objective: string; action: string; steps: string;
    }): Promise<BaseChatMessage> {
        return await super.predict({
            objective,
            action,
            steps
        });
    }
}