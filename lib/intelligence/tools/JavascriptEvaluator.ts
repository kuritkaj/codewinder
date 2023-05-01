import { Tool } from "langchain/tools";

export class JavascriptEvaluator extends Tool {
    name = "javascript-evaluator";

    description = `
An isolated environment to evaluate and run Javascript; includes fetch to fetch resources.
The javascript program provided should always return a string.
    `;

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
