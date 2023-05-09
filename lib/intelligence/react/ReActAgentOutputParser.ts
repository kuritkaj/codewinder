import { AgentActionOutputParser, OutputParserArgs } from "langchain/agents";
import { ACTION, FINAL_RESPONSE, FORMAT_INSTRUCTIONS } from "@/lib/intelligence/react/prompts";
import { AgentAction, AgentFinish } from "langchain/schema";
import { Multistep } from "@/lib/intelligence/tools/Multistep";

export class ReActAgentActionOutputParser extends AgentActionOutputParser {
    finishToolName: string;

    constructor(fields?: OutputParserArgs) {
        super();
        this.finishToolName = fields?.finishToolName || FINAL_RESPONSE;
    }

    actionPrefix() {
        return `${ ACTION }:`;
    }

    responsePrefix() {
        return `${ FINAL_RESPONSE }:`;
    }

    async parse(text: string): Promise<AgentAction | AgentFinish> {
        const responder = async (response: string) => {
            return { returnValues: { output: `${ response }` }, log: response };
        }

        if (text.includes(`${ this.responsePrefix() }`)) {
            const parts = text.split(`${ this.responsePrefix() }`);
            const output = parts[parts.length - 1].trim();
            return await responder(output);
        }

        if (text.includes(`${ this.actionPrefix() }`)) {
            const parts = text.split(`${ this.actionPrefix() }`);
            const output = parts[parts.length - 1].trim();

            // Check to see if this is surrounded by markdown code blocks
            const regex = /(?<=```)[\s\S]*?(?=\n```)/;
            const matches = output.match(regex);

            try {
                const json = (matches && matches.length > 0) ? matches.pop() : output;
                const actions = JSON.parse(json);

                if (Array.isArray(actions)) {
                    return {
                        tool: Multistep.name,
                        toolInput: actions.join('\n'),
                        log: text,
                    };
                } else {
                    return {
                        tool: actions.action,
                        toolInput: typeof actions.action_input === 'string' ? actions.action_input : JSON.stringify(actions.action_input),
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