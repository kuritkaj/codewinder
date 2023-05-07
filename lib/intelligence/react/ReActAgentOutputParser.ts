import { AgentActionOutputParser, OutputParserArgs } from "langchain/agents";
import { FINAL_RESPONSE, FORMAT_INSTRUCTIONS } from "@/lib/intelligence/react/prompts";
import { AgentAction, AgentFinish } from "langchain/schema";

export class ReActAgentActionOutputParser extends AgentActionOutputParser {
    finishToolName: string;

    constructor(fields?: OutputParserArgs) {
        super();
        this.finishToolName = fields?.finishToolName || FINAL_RESPONSE;
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

        const regex = /{[^{}]*}/g; // match on JSON brackets.
        const matches = text.match(regex);

        if (!matches || matches.length === 0) return await responder(text);

        try {
            const actions = matches.map(match => JSON.parse(match));
            const action = actions.pop();
            return {
                tool: action.action,
                toolInput: typeof action.action_input === 'string' ? action.action_input : JSON.stringify(action.action_input),
                log: text,
            };
        } catch {
            return await responder(text);
        }
    }

    getFormatInstructions(): string {
        return FORMAT_INSTRUCTIONS;
    }
}