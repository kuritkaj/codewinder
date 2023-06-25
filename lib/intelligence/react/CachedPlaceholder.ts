import { MessagesPlaceholder } from "langchain/prompts";
import { BaseChatMessage, InputValues } from "langchain/schema";

export class CachedPlaceholder extends MessagesPlaceholder {

    private cachedMessages: BaseChatMessage[];

    public async formatMessages(values: InputValues): Promise<BaseChatMessage[]> {
        if (this.cachedMessages) {
            return Promise.resolve(this.cachedMessages);
        } else {
            this.cachedMessages = await super.formatMessages(values);
            return Promise.resolve(this.cachedMessages);
        }
    }
}