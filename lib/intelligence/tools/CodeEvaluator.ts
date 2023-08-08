// Inspiration: https://github.com/MineDojo/Voyager/blob/main/voyager/prompts/action_response_format.txt

import { GuardChain } from "@/lib/intelligence/chains/GuardChain";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { SupabaseClient } from "@supabase/supabase-js";
import { LLMChain } from "langchain";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "code-evaluator";
export const DESCRIPTION = `an isolated Node.js environment to evaluate and run code. 
Results are returned as a string. Never use this to respond with code to the user.
Input should include all useful context from previous functions and results.`;

const SPECIFICATION_INPUT = "specification";
const ENVIRONMENT_INPUT = "environment";
const EXAMPLE_INPUT = "example";

export const GUIDANCE = `You are an AI assistant receiving a detailed code specification. 
Your task is to translate this specification into executable JavaScript code, 
which should then be run in a secure code environment to produce a result.

This is the code specification:
{${SPECIFICATION_INPUT}}

Please consider the following when developing the code:
* The environment is an isolated Node.js setup with fetch() available for network requests.
   ...(Example using fetch: const response = await fetch('https://api.example.com/data');)
* You cannot require or import any new libraries and the code must not rely on environment variables.
* Aim to keep the code as simple and straightforward as possible, adhering to the specification.
* Your output should be executable code that returns a result as a string immediately upon execution.
* Always throw errors, never return them as strings.

You have access to these environment variables:
{${ENVIRONMENT_INPUT}}
To access these environment variables, use: \`process.env['ENVIRONMENT_VARIABLE_NAME']\`.

Here's an example of similar function you've developed in the past:
\`\`\`javascript
{${EXAMPLE_INPUT}}
\`\`\`

Now, based on the natural language description, your task is to generate JavaScript code for immediate evaluation and return.

Here's the required format for your response:
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
\`\`\``;

export interface CodeExecutorParams extends ToolParams {
    model: BaseLanguageModel;
    store?: MemoryStore;
    supabase: SupabaseClient;
}

export class CodeEvaluator extends StructuredTool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;
    public schema = z.
    object({
        input: z.string().describe("code specification")
    }).transform((obj) => obj.input);

    private readonly llmChain: LLMChain;
    private readonly store?: MemoryStore;
    private readonly supabase: SupabaseClient;

    constructor({callbacks, model, store, supabase, verbose}: CodeExecutorParams) {
        super({verbose, callbacks});

        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        this.llmChain = new GuardChain({
            llm: model,
            callbacks: callbacks,
            prompt
        });

        this.store = store;
        this.supabase = supabase;
    }

    /** @ignore */
    async _call(specification: string): Promise<string> {
        // Filter environment variables starting with "VM_"
        const vmEnvironmentVariables = Object.entries(process.env).filter(([key]) => key.startsWith("VM_")).reduce((acc, [key, value]) => {
            const strippedKey = key.replace("VM_", ""); // Remove the prefix
            acc[strippedKey] = value;
            return acc;
        }, {});

        // Generate a string of the keys that start with "VM_"
        const vmEnvironmentKeys = Object.keys(vmEnvironmentVariables).join(", ");

        // Retrieve a similar example from memory.
        const memory = this.store && await this.store.retrieve(specification, 1);
        const example = memory && memory.length > 0 ? memory[0].pageContent : "No example found.";

        // Generate JavaScript code from the natural language description.
        const completion = await this.llmChain.predict({
            [SPECIFICATION_INPUT]: specification,
            [ENVIRONMENT_INPUT]: vmEnvironmentKeys,
            [EXAMPLE_INPUT]: example
        });

        const regex = /(?<=```javascript)[\s\S]*?(?=\n```)/;
        const matches = completion.match(regex);
        const code = matches?.pop() || completion;

        try {
            // this enables communication between the server and the client to execute code as needed
            const comms = this.supabase.channel("code-evaluator", {
                config: {
                    broadcast: {
                        ack: true,
                    },
                },
            });
            // Channel is removed in chat -> finally.

            const waitForEvent = (): Promise<string> => {
                const timeoutms = 10000;

                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Timeout: Event not triggered within the specified time."));
                    }, timeoutms);


                    comms?.on("broadcast", {event: "eval-result"}, (payload) => {
                        clearTimeout(timeout);
                        resolve(payload.result);
                    });
                });
            }

            comms.subscribe();
            await comms.send({
                type: "broadcast",
                event: "eval-code",
                payload: {code}
            });

            const result = await waitForEvent();

            // // Evaluate the generated JavaScript code.
            // const output = vm.runInNewContext(code, {
            //     console,
            //     fetch,
            //     process: {
            //         env: vmEnvironmentVariables
            //     }
            // }, {timeout: 3000});
            // const result = await output;

            // store this program for future reference
            if (this.store) {
                await this.store.storeTexts([`${code}\n\nThe prior code successfully returned this result: ${result}`], {
                    specification: specification
                });
            }

            return result || "No results returned.";
        } catch (error) {
            // store this program for future reference
            if (this.store) {
                await this.store.storeTexts([`${code}\n\nThe prior code errored with this message: ${error.message}`], {
                    specification: specification
                })
            }

            return JSON.stringify({error: error.message});
        }
    }
}
