import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const FINAL_RESPONSE = "Final Response";
export const OBJECTIVE_INPUT = "objective";
export const RESPONSE_INPUT = "response";
export const SCRATCHPAD_INPUT = "scratchpad";
export const TOOL_INPUT = "tools";

export const GUIDANCE = `
An AI assistant is helping a user achieve this specific objective: {${ OBJECTIVE_INPUT }}
The AI assistant was asked to use one or more tools to achieve this objective.

Here is the history of past actions and experiences to achieve this objective: {${ SCRATCHPAD_INPUT }}

Based on these past actions and experiences, the AI has now responded with: {${ RESPONSE_INPUT }}

And these are the allowed tools: {${ TOOL_INPUT }}

Evaluate the provided response and determine if the AI assistant should continue with the proposed action or not:
* Does the selected tool and proposed input meet the stated objective based on the past actions and experiences?
* Is the action starting to go on a tangent?
* Is the previous step a duplicate of a past action? (Avoid trying the same thing more than once)
* Is the selected tool from the allowed tools and appropriate input?
* Is the action starting to drift from the original objective? If so, correct that.
Explain why or why not.

ImproveIf the proposed action is a good course of action, then repeat it.
Alternatively, propose a better one which could be a new tool or the same tool with an improved tool input.

Always respond with this format:
Action:
\`\`\`
{{
  "action": "tool name",
  "action_input": "tool input"
}}
\`\`\`
   (the Action: should only contain a SINGLE action, NEVER return more than one action)
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