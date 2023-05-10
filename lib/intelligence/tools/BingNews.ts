import { Tool, ToolParams } from "langchain/tools";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "langchain/embeddings";

export interface BingNewParams extends ToolParams {
    apiKey: string | undefined;
    embeddings: Embeddings;
    memory?: MemoryStore;
    params?: Record<string, string>;
}

export class BingNews extends Tool {
    readonly name = "news-search";
    readonly description = "find headlines and articles on trending topics. Input is a string for a web search query.";

    readonly embeddings: Embeddings;
    readonly key: string;
    readonly memory: MemoryStore;
    readonly params: Record<string, string>;

    constructor({ apiKey, params, memory, embeddings, verbose, callbacks }: BingNewParams) {
        super(verbose, callbacks);

        if (!apiKey) {
            throw new Error(
                "BING_API_KEY key not set."
            );
        }

        this.embeddings = embeddings;
        this.key = apiKey;
        this.memory = memory;
        this.params = params;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        input = input.replace(/^"(.+(?="$))"$/, '$1');

        const headers = { "Ocp-Apim-Subscription-Key": this.key };
        const params = { q: input, textDecorations: "true", textFormat: "HTML", count: "20" };
        const searchUrl = new URL("https://api.bing.microsoft.com/v7.0/news/search");

        Object.entries(params).forEach(([key, value]) => {
            searchUrl.searchParams.append(key, value);
        });

        const response = await fetch(searchUrl, { headers });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const res = await response.json();
        const results: { name: string, description: string, url: string }[] = res.value;

        if (results.length === 0) {
            await runManager?.handleText("No useful results found.");
            return "No useful results found.";
        }

        for (const result of results) {
            if (this.memory) await this.memory.storeText(result.description, [ { name: result.name }, { url: result.url } ]);
        }

        const links = results.map(result => `[${ result.name }](${ result.url }) - ${ result.description }`);

        // this is short-term memory for searching on the page:
        const vectorStore = await MemoryVectorStore.fromTexts(
            links,
            [],
            this.embeddings
        );
        const similar = await vectorStore.similaritySearch(input, 4);

        return similar.map((res) => res.pageContent).join("\n");
    }
}