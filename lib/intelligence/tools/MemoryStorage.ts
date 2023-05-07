import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { StringPromptValue } from "langchain/prompts";
import { BaseLanguageModel } from "langchain/base_language";
import { WebBrowser } from "@/lib/intelligence/tools/WebBrowser";
import { Embeddings } from "langchain/embeddings";

function extractUrl(str: string): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/gi; // regular expression to match URLs
    const urls = str.match(urlRegex); // search for URLs in the string

    if (urls && urls.length > 0) {
        return urls[0]; // return the first URL found
    } else {
        return null; // no URLs found in the string
    }
}

interface MemoryStorageParams extends ToolParams {
    embeddings: Embeddings;
    memory: MemoryStore;
    model: BaseLanguageModel;
}

export class MemoryStorage extends Tool {
    readonly name = "memory-storage";
    readonly description = "saves the provided input to memory for recall later. " +
        "The input should include enough context to be easily retrievable in the future." +
        "Alternatively, provide a valid url to save the contents of that page.";

    readonly browser: WebBrowser;
    readonly memory: MemoryStore;
    readonly model: BaseLanguageModel;

    constructor({ model, memory, embeddings, verbose, callbacks }: MemoryStorageParams) {
        super(verbose, callbacks);

        this.memory = memory;
        this.model = model;

        this.browser = new WebBrowser({ model, memory, embeddings, callbacks })
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        const url = extractUrl(input);
        if (url) {
            // here, we store the full page, since browser has been provided memory.
            const summary = await this.browser._call(`[${url},""`, runManager);

            // and we store the summary returned as a separate memory for easier retrieval later.
            await this.memory.storeText(summary);

            return "Webpage saved."
        } else {
            const prompt = `Rewrite this provided input to be easily recalled in the future: ${ input }`;

            const res = await this.model.generatePrompt(
                [ new StringPromptValue(prompt) ],
                undefined,
                runManager?.getChild()
            );

            const memory = res.generations[0][0].text;

            await this.memory.storeText(memory);

            return "Memory saved."
        }
    }
}
