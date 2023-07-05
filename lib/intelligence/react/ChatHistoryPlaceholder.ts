import { MessagesPlaceholder } from "langchain/prompts";
import { AIChatMessage, BaseChatMessage, HumanChatMessage, InputValues } from "langchain/schema";

export class ChatHistoryPlaceholder extends MessagesPlaceholder {

    public formatMessages(values: InputValues): Promise<BaseChatMessage[]> {
        const messages: BaseChatMessage[] = [];

        let history = values[this.variableName];

        if (history) {
            if (typeof history === 'string') {
                // Case: string
                if (history) messages.push(new HumanChatMessage(history));
            } else if (Array.isArray(history)) {
                // Case: array of two strings or array of arrays of two strings
                // Example: ["Hi there! How can I help?", "apimessage"]
                if (typeof history[0] === 'string') {
                    // Case: array of two strings
                    const [message, type] = history;
                    if (type === "apimessage") messages.push(new HumanChatMessage(message));
                    if (type === "usermessage") messages.push(new AIChatMessage(message));
                } else if (Array.isArray(history[0])) {
                    // Case: array of arrays of two strings
                    // Example: [["Hi there! How can I help?", "apimessage"]]
                    for (const [message, type] of history) {
                        if (type === "apimessage") messages.push(new HumanChatMessage(message));
                        if (type === "usermessage") messages.push(new AIChatMessage(message));
                    }
                }
            }
        }

        return Promise.resolve(messages);
    }
}