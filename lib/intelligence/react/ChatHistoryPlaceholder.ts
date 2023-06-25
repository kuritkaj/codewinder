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
                if (typeof history[0] === 'string') {
                    // Case: array of two strings
                    const [human, ai] = history;
                    if (human) messages.push(new HumanChatMessage(human));
                    if (ai) messages.push(new AIChatMessage(ai.replace(/<details>[\s\S]*?<\/details>/g, '').trim()));
                } else if (Array.isArray(history[0])) {
                    // Case: array of arrays of two strings
                    for (const [human, ai] of history) {
                        if (human) messages.push(new HumanChatMessage(human));
                        if (ai) messages.push(new AIChatMessage(ai.replace(/<details>[\s\S]*?<\/details>/g, '').trim()));
                    }
                }
            }
        }

        return Promise.resolve(messages);
    }
}