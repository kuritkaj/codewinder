import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const OBJECTIVE_INPUT = "objective";
export const RESPONSE_INPUT = "response";
export const SCRATCHPAD_INPUT = "scratchpad";
export const TOOL_INPUT = "tools";

export const GUIDANCE = `
An AI assistant is helping a user achieve this specific objective: {${ OBJECTIVE_INPUT }}
The AI assistant was asked to use one or more tools to achieve this objective.

Here is the history of past actions and experiences to achieve this objective: {${ SCRATCHPAD_INPUT }}

Based on these past actions and experiences, the AI has now responded with: {${ RESPONSE_INPUT }}

Does the tool selected and proposed input meet the stated objective based on the past actions and experiences? 
Explain why or why not.

Then, if so, respond with the action using this format:
Action:
\`\`\`
{{
  "action": "tool name",
  "action_input": "tool input"
}}
\`\`\`
   (the Action: should only contain a SINGLE action, NEVER return more than one action)
   
If not, respond with a new action and action input, using the previous format.

If you choose a new action to take, you must select from the following tools: {${ TOOL_INPUT }}
Never select a tool name that isn't in the allowed list.
`;

interface EvaluatorInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Reflection extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: EvaluatorInput): Reflection {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Reflection({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    async evaluate({ objective, response, scratchpad, tools }: {
        objective: string; response: string; scratchpad: string; tools: string
    }): Promise<string> {
        const summary = await this.call({
            objective,
            response,
            scratchpad,
            tools
        });
        return summary.text;
    }
}