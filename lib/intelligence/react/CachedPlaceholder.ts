import { MessagesPlaceholder } from "langchain/prompts";
import { BaseMessage, InputValues } from "langchain/schema";

export class CachedPlaceholder extends MessagesPlaceholder {

    private cachedMessages: BaseMessage[];

    public async formatMessages(values: InputValues): Promise<BaseMessage[]> {
        if (this.cachedMessages) {
            return Promise.resolve(this.cachedMessages);
        } else {
            this.cachedMessages = await super.formatMessages(values);
            return Promise.resolve(this.cachedMessages);
        }
    }
}