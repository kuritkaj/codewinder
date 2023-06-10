// Inspiration: https://github.com/MineDojo/Voyager/blob/main/voyager/prompts/action_response_format.txt

import { Tool, ToolParams } from "langchain/tools";
import { BaseLanguageModel } from "langchain/base_language";
import { LLMChain } from "langchain";
import { PromptTemplate } from "langchain/prompts";
import * as vm from "node:vm";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { GuardChain } from "@/lib/intelligence/chains/GuardChain";

export const NAME = "code-evaluator";
export const DESCRIPTION = `an AI-powered javascript evaluator.
Always include complete, relevant details in the specification from previous observations and actions.
The specification should never try to request inputs or placeholders; all details must be specified in the specification.
This does not create a generic function, but instead should be special purpose to meet the provided specification.
Input format:
{{
  "action": "${ NAME }",
  "action_input": "specification in natural language for javascript"
}}`;

const SPECIFICATION_INPUT = "specification";
const ENVIRONMENT_INPUT = "environment";
const EXAMPLE_INPUT = "example";

export const GUIDANCE = `
You are an AI assistant that is being provided a code specification.
Your responsibility is to write the appropriate function to be run in a secure code environment, returning the result to the requestor.

This is the code specification:
{${SPECIFICATION_INPUT}}

You have access to these environment variables:
{${ENVIRONMENT_INPUT}}
Access these environment variables like this: process.env['ENVIRONMENT_VARIABLE_NAME'].

The code you write should take into account these considerations:
* The environment the code will run in is an isolated Node.js environment with fetch() available.
   ...(here's an example using fetch: const response = await fetch('https://api.example.com/data');)
* You cannot require or import any new libraries and should never write code that relies upon environment variables.
* Code should be as simple as possible to meet the specification.
* All output should be software that is expected to immediately be interpreted and executed so as to return a string.

Here's a function you wrote similar to this in the past:
\`\`\`javascript
{${EXAMPLE_INPUT}}
\`\`\`

Now, translate the natural language description into JavaScript code for immediate evaluation and return.

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
`;

export interface CodeEvaluatorParams extends ToolParams {
    model: BaseLanguageModel;
    memory: MemoryStore;
}

export class CodeEvaluator extends Tool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;

    private readonly llmChain: LLMChain;
    private readonly memory: MemoryStore;

    constructor({ model, memory, verbose, callbacks }: CodeEvaluatorParams) {
        super(verbose, callbacks);

        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        this.llmChain = new GuardChain({
            llm: model,
            callbacks: callbacks,
            prompt
        });

        this.memory = memory;
    }

    /** @ignore */
    async _call(specification: string): Promise<string> {
        // Filter environment variables starting with "VM_"
        const vmEnvironmentVariables = Object.entries(process.env)
        .filter(([key]) => key.startsWith("VM_"))
        .reduce((acc, [key, value]) => {
            const strippedKey = key.replace("VM_", ""); // Remove the prefix
            acc[strippedKey] = value;
            return acc;
        }, {});

        // Generate a string of the keys that start with "VM_"
        const vmEnvironmentKeys = Object.keys(vmEnvironmentVariables).join(", ");

        // Retrieve a similar example from memory.
        const memory = await this.memory.retrieve(specification, 0.80);
        const example = memory && memory.length > 0 ? memory[0].pageContent : "No example found.";

        // Generate JavaScript code from the natural language description.
        const completion = await this.llmChain.predict({
            [SPECIFICATION_INPUT]: specification,
            [ENVIRONMENT_INPUT]: vmEnvironmentKeys,
            [EXAMPLE_INPUT]: example
        });

        const regex = /(?<=```javascript)[\s\S]*?(?=\n```)/;
        const matches = completion.match(regex);
        const match = matches.pop();

        try {
            // Evaluate the generated JavaScript code.
            const output = vm.runInNewContext(match, {
                console,
                fetch,
                process: {
                    env: vmEnvironmentVariables
                }
            }, { timeout: 3000 });
            const result = output ? await output : "No result returned.";

            // store this program for future reference
            await this.memory.storeTexts([match],  {
                specification: specification
            })

            return result;
        } catch (error) {
            return JSON.stringify({ error: error.message });
        }
    }
}
