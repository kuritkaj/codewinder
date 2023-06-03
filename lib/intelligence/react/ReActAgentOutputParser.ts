// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/chat/outputParser.ts

import { OutputParserArgs } from "langchain/agents";
import { ACTION, FINAL_RESPONSE, FORMAT_INSTRUCTIONS } from "@/lib/intelligence/react/prompts";
import { AgentAction, AgentFinish } from "langchain/schema";
import { BaseOutputParser } from "langchain/schema/output_parser";

/*
Expected format from ReActAgent.prompts.ts:

```
[{{
  "action": "tool name",
  "action_input": "tool input"
}}]
```
*/
type Action = {
    action: string;
    action_input: string | Record<string, any>;
}

export class ReActAgentActionOutputParser extends BaseOutputParser<AgentAction[] | AgentFinish> {
    private readonly finishToolName: string;

    constructor(fields?: OutputParserArgs) {
        super();
        this.finishToolName = fields?.finishToolName || FINAL_RESPONSE;
    }

    actionPrefix() {
        return `${ ACTION }:`;
    }

    finalPrefix() {
        return `${ FINAL_RESPONSE }:`;
    }

    async parse(text: string): Promise<AgentAction[] | AgentFinish> {
        const actionResponder = async (actions: Action[]): Promise<AgentAction[]> => {
            let tools = [];
            actions.forEach(action => {
                tools.push({
                    tool: action.action,
                    toolInput: typeof action.action_input !== "string" ? JSON.stringify(action.action_input) : action.action_input,
                    log: text,
                });
            });
            return tools;
        }
        const finalResponder = async (response: string): Promise<AgentFinish> => {
            return { returnValues: { output: `${ response }` }, log: response };
        }

        if (text.includes(`${ this.finalPrefix() }`)) {
            const parts = text.split(`${ this.finalPrefix() }`);
            const output = parts[parts.length - 1].trim();
            return await finalResponder(output);
        }

        if (text.includes(`${ this.actionPrefix() }`) || text.includes("\`\`\`")) {
            const parts = text.split(`${ this.actionPrefix() }`);
            const output = parts[parts.length - 1].trim();

            // Check to see if this is surrounded by Markdown code blocks
            const regex = /(?<=```)[\s\S]*?(?=\n```)/;
            const matches = output.match(regex);

            try {
                const json = (matches && matches.length > 0) ? matches.pop() : output;
                const actions = JSON.parse(json);

                if (Array.isArray(actions)) {
                    return await actionResponder(actions);
                } else {
                    return await actionResponder([actions]);
                }
            } catch {
                return await finalResponder(text);
            }
        }

        return await finalResponder(text);
    }

    getFormatInstructions(): string {
        return FORMAT_INSTRUCTIONS;
    }
}