import { Tool } from "langchain/tools";

export class JavascriptEvaluator extends Tool {
    readonly name = "javascript-evaluator";
    readonly description = "an isolated Node.js environment with fetch() to evaluate and run code. Programs must always return a string.";

    constructor() {
        super();
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
