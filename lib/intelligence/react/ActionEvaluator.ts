import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const EVALUATION = "Evaluation";
export const OBJECTIVE_INPUT = "objective";
export const RESPONSE_INPUT = "response";
export const SCRATCHPAD_INPUT = "scratchpad";
export const SCORE = "score";
export const TOOL_INPUT = "tools";

export const GUIDANCE = `
An AI assistant is helping a user achieve this specific objective: {${ OBJECTIVE_INPUT }}
The AI assistant was asked to use one or more tools to achieve this objective.

Here is the history of past actions and experiences to achieve this objective: {${ SCRATCHPAD_INPUT }}

Based on these past actions and experiences, the AI has now responded with: {${ RESPONSE_INPUT }}

And these are the allowed tools: {${ TOOL_INPUT }}

Provide a step-by-step evaluation of the response based on the following criteria:
* Does the response meet the stated objective based on the past actions and experiences?
* Is the response starting to go on a tangent or starting to drift from the original objective?
* Does the response duplicate past actions? (Avoid trying the same thing more than once)
* Does the response only select one or more tools from the allowed tools list?
* Are too many steps required to achieve the objective?

Based on this evaluation, provide a score from 1 to 5 (low to high) representing your confidence that the response will achieve the stated objective.

Use this format to respond:
${EVALUATION}: evaluation of the response
${SCORE}: confidence score of the response from 1 to 5 (low to high)

If the score is low (1, 2, or 3), then provide a new set of actions to take using this format:
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

export class ActionEvaluator extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: EvaluatorInput): ActionEvaluator {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new ActionEvaluator({
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