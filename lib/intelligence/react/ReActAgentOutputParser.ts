// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/chat/outputParser.ts

import { OutputParserArgs } from "langchain/agents";
import { ACTION, FINAL_RESPONSE, FORMAT_INSTRUCTIONS } from "@/lib/intelligence/react/prompts";
import { AgentAction, AgentFinish } from "langchain/schema";
import { NAME as MultistepName } from "@/lib/intelligence/multistep/MultistepExecutor";
import { BaseOutputParser } from "langchain/schema/output_parser";

export class ReActAgentActionOutputParser extends BaseOutputParser<AgentAction | AgentFinish> {
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

    async parse(text: string): Promise<AgentAction | AgentFinish> {
        const responder = async (response: string) => {
            return { returnValues: { output: `${ response }` }, log: response };
        }

        if (text.includes(`${ this.finalPrefix() }`)) {
            const parts = text.split(`${ this.finalPrefix() }`);
            const output = parts[parts.length - 1].trim();
            return await responder(output);
        }

        if (text.includes(`${ this.actionPrefix() }`) || text.startsWith('{')) {
            const parts = text.split(`${ this.actionPrefix() }`);
            const output = parts[parts.length - 1].trim();

            // Check to see if this is surrounded by markdown code blocks
            const regex = /(?<=```)[\s\S]*?(?=\n```)/;
            const matches = output.match(regex);

            try {
                const json = (matches && matches.length > 0) ? matches.pop() : output;
                const actions = JSON.parse(json);

                if (Array.isArray(actions) && actions.length > 1) {
                    const toolInput = `{ "steps": [${actions.map(action => { return `"${action.action_input}"`; }).join(",\n") }] }`;
                    return {
                        tool: MultistepName,
                        toolInput,
                        log: text,
                    };
                } else {
                    let action = Array.isArray(actions) ? actions.pop() : actions;
                    return {
                        tool: action.action,
                        toolInput: typeof action.action_input === 'string' ? action.action_input : JSON.stringify(action.action_input),
                        log: text,
                    };
                }
            } catch {
                return await responder(text);
            }
        }

        return await responder(text);
    }

    getFormatInstructions(): string {
        return FORMAT_INSTRUCTIONS;
    }
}