import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { StringPromptValue } from "langchain/prompts";
import { BaseLanguageModel } from "langchain/base_language";
import { WebBrowser } from "@/lib/intelligence/tools/WebBrowser";
import { Embeddings } from "langchain/embeddings";

const DESCRIPTION = `only use this tool if directed to by the user.
Input should be one or more urls, separated by commas - just links, no additional text.
Alternative, text can be provided as a string to store and should include a name and url if applicable.
`;

function extractUrls(str: string): string[] | null {
    const urlRegex = /(https?:\/\/\S+)/gi; // regular expression to match URLs
    const urls = str.match(urlRegex); // search for URLs in the string

    if (urls && urls.length > 0) {
        return urls; // return the first URL found
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
    readonly description = DESCRIPTION;

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
        const urls = extractUrls(input);

        if (urls && urls.length > 0) {
            let summary;
            for (const url of urls) {
                // here, we store the full page, since browser has been provided memory.
                summary = await this.browser._call(`[${ url },""`, runManager);
            }

            return summary;
        } else {
            const prompt = `Rewrite this provided input to be easily recalled in the future: ${ input }`;

            const res = await this.model.generatePrompt(
                [ new StringPromptValue(prompt) ],
                undefined,
                runManager?.getChild()
            );

            const memory = res.generations[0][0].text;

            await this.memory.storeText(memory);

            return memory;
        }
    }
}
