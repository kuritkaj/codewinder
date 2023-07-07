// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/chat/outputParser.ts

import { FINAL_RESPONSE_PREFIX } from "@/lib/intelligence/react/ReActAgent";
import { AgentAction, AgentFinish, BaseMessage } from "langchain/schema";

export class ReActAgentOutputParser {

    finalPrefix() {
        return `${FINAL_RESPONSE_PREFIX}:`;
    }

    public async parse(message: BaseMessage): Promise<AgentAction | AgentFinish> {
        const actionResponder = async (function_call): Promise<AgentAction> => {
            return {
                tool: function_call.name as string,
                toolInput: function_call.arguments
                    ? JSON.parse(function_call.arguments)
                    : {},
                log: message.content,
            }
        }

        const finalResponder = async (response: string): Promise<AgentFinish> => {
            return {
                returnValues: {
                    output: `${response}`
                },
                log: response
            };
        }

        try {
            if (message.additional_kwargs.function_call) {
                return await actionResponder(message.additional_kwargs.function_call);
            } else {
                const text = message.content;

                if (text.includes(`${this.finalPrefix()}`)) {
                    const parts = text.split(`${this.finalPrefix()}`);
                    const output = parts[parts.length - 1].trim();
                    return await finalResponder(output);
                }

                return await finalResponder(text);
            }
        } catch (e) {
            console.log("Error parsing message", e);
            throw e;
        }
    }
}