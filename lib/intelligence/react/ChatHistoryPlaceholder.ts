import { MessageType } from "@/lib/types/MessageType";
import { MessagesPlaceholder } from "langchain/prompts";
import { AIMessage, BaseMessage, HumanMessage, InputValues } from "langchain/schema";

export class ChatHistoryPlaceholder extends MessagesPlaceholder {

    private readonly limit: number;

    constructor(variableName: string, tokenLimit: number) {
        super(variableName);
        this.limit = tokenLimit * 4; // Rough approximation of characters per token.
    }

    public formatMessages(values: InputValues): Promise<BaseMessage[]> {
        let messages: BaseMessage[] = [];

        let history = values[this.variableName];

        if (history) {
            if (typeof history === 'string') {
                // Case: string
                if (history) messages.push(new HumanMessage(history));
            } else if (Array.isArray(history)) {
                // Case: array of two strings or array of arrays of two strings
                // Example: ["Hi there! How can I help?", "apimessage"]
                if (typeof history[0] === 'string') {
                    // Case: array of two strings
                    const [message, type] = history;
                    if (message && type === MessageType.UserMessage.toString()) messages.push(new HumanMessage(message));
                    if (message && type === MessageType.ApiMessage.toString()) messages.push(new AIMessage(message));
                } else if (Array.isArray(history[0])) {
                    // Case: array of arrays of two strings
                    // Example: [["Hi there! How can I help?", "apimessage"]]
                    for (const [message, type] of history) {
                        if (message && type === MessageType.UserMessage.toString()) messages.push(new HumanMessage(message));
                        if (message && type === MessageType.ApiMessage.toString()) messages.push(new AIMessage(message));
                    }
                }
            }
        }

        let currentLength = messages.reduce((acc, message) => acc + message.content.length, 0);
        while (currentLength > this.limit && messages.length > 0) {
            currentLength -= messages[0].content.length;
            messages.shift();
        }

        // Remove the first messages that exceed the limit


        return Promise.resolve(messages);
    }
}