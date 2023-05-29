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

And these are the allowed tools: {${ TOOL_INPUT }}

Evaluate the provided response and determine if the AI assistant should continue with the proposed action(s) or not:
* Does the response meet the stated objective based on the past actions and experiences?
* Is the response starting to go on a tangent or starting to drift from the original objective?
* Does the response duplicate past actions? (Avoid trying the same thing more than once)
* Does the response only select one or more tools from the allowed tools list?

Use this format to respond:
Evaluation: evaluation of the response as outlined above.
Action:
\`\`\`
[{{
  "action": "tool name",
  "action_input": "tool input"
}}]
\`\`\`
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