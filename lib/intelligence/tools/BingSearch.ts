import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "langchain/embeddings";

export interface BingSearchParams extends ToolParams {
    apiKey: string | undefined;
    embeddings: Embeddings;
    memory?: MemoryStore;
    params?: Record<string, string>;
}

export class BingSearch extends Tool {
    readonly name = "web-search";
    readonly description = "find answers on the web. Input is a string for a web search query.";

    readonly embeddings: Embeddings;
    readonly key: string;
    readonly memory: MemoryStore;
    readonly params: Record<string, string>;

    constructor({ apiKey, params, memory, embeddings, verbose, callbacks }: BingSearchParams) {
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
        const searchUrl = new URL("https://api.bing.microsoft.com/v7.0/search");

        Object.entries(params).forEach(([ key, value ]) => {
            searchUrl.searchParams.append(key, value);
        });

        const response = await fetch(searchUrl, { headers });

        if (!response.ok) {
            await runManager?.handleToolError(`HTTP error ${ response.status }`);
            throw new Error(`HTTP error ${ response.status }`);
        }

        const res = await response.json();
        const results: { name: string, snippet: string, url: string }[] = res.webPages.value;

        if (results.length === 0) {
            await runManager?.handleText("No useful results found.");
            return "No useful results found.";
        }

        for (const result of results) {
            if (this.memory) await this.memory.storeText(result.snippet, [ { name: result.name }, { url: result.url } ]);
        }

        const links = results.map(result => `[${ result.name }](${ result.url }) - ${ result.snippet }`);

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