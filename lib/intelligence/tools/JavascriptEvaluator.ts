import { Tool, ToolParams } from "langchain/tools";

const NAME = "javascript-evaluator";
const DESCRIPTION = `an isolated Node.js environment with fetch() to evaluate and run code. Programs must always return a string.
Input format:
{{
  "action": "${ NAME }",
  "action_input": "code to execute"
}}`;

export class JavascriptEvaluator extends Tool {
    readonly name = NAME;
    readonly description = DESCRIPTION;

    constructor({ verbose = false, callbacks = undefined}: Partial<ToolParams> = {}) {
        super(verbose, callbacks);
    }

    /** @ignore */
    async _call(input: string): Promise<string> {
        try {
            const result = eval(input);
            return JSON.stringify(result);
        } catch (error) {
            return JSON.stringify({ error: error.message });
        }
    }
}
