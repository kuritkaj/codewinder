// Inspiration: https://github.com/MineDojo/Voyager/blob/main/voyager/prompts/action_response_format.txt

import { Tool, ToolParams } from "langchain/tools";
import { BaseLanguageModel } from "langchain/base_language";
import { LLMChain } from "langchain";
import { PromptTemplate } from "langchain/prompts";
import * as vm from "node:vm";

const NAME = "javascript-evaluator";
const DESCRIPTION = `an AI-powered JavaScript evaluator. 
Write a description for a function that will return the desired output as a string.
Input format:
{{
  "action": "${ NAME }",
  "action_input": "code specification in natural language"
}}`;

export const GUIDANCE = `
You are an AI assistant that is being provided a code specification 
to write and then executive in a secure code environment, returning the result to the requestor.

Provided the following code specification:
{specification}

Translate the natural language description into JavaScript code for immediate evaluation and return.

Always use this format:
Explain: ...
Plan:
1) ...
2) ...
3) ...
...
Code:
\`\`\`javascript
// helper functions (only if needed, try to avoid them)
...
// main function after the helper functions
(async function() {{
    function yourMainFunctionName() {{
      // ...
    }}

    return await yourMainFunctionName();
}})();
\`\`\`

Considerations:
* The environment the code will run in is an isolated Node.js environment with fetch() available.
* You cannot require any new libraries and should never write code that relies upon environment variables.
* Code should be as simple as possible to meet the specification.
* All output should be software that is expected to immediately be interpreted and executed so as to return a string.
`;

export interface JavascriptEvaluatorParams extends ToolParams {
    model: BaseLanguageModel;
}

export class JavascriptEvaluator extends Tool {
    readonly name = NAME;
    readonly description = DESCRIPTION;

    private readonly llmChain: LLMChain;

    constructor({ model, verbose, callbacks }: JavascriptEvaluatorParams) {
        super(verbose, callbacks);

        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        this.llmChain = new LLMChain({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    /** @ignore */
    async _call(specification: string): Promise<string> {
        // Generate JavaScript code from the natural language description.
        const response = await this.llmChain.call({ specification });
        const output = response.text;

        const regex = /(?<=```javascript)[\s\S]*?(?=\n```)/;
        const matches = output.match(regex);

        try {
            // Evaluate the generated JavaScript code.
            const result = vm.runInNewContext(matches.pop(), {
                console,
                fetch,
            }, {timeout: 3000});
            return result ? await result : "No result returned.";
        } catch (error) {
            return JSON.stringify({ error: error.message });
        }
    }
}
