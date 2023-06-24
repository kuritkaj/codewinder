// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/tools/bingserpapi.ts

import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { Embeddings } from "langchain/embeddings";
import { Tool, ToolParams } from "langchain/tools";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { z } from "zod";

export const NAME = "search";
export const DESCRIPTION = `a search engine. Useful to answer questions about current events.`;

export interface WebSearchParams extends ToolParams {
    apiKey: string | undefined;
    embeddings: Embeddings;
    params?: Record<string, string>;
    store?: MemoryStore;
}

export class WebSearch extends Tool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;
    public schema = z.object(
        {input: z.string().describe("search query").optional()}
    ).transform((obj) => obj.input);

    private readonly embeddings: Embeddings;
    private readonly key: string;
    private readonly params: Record<string, string>;
    private readonly store: MemoryStore;

    constructor({apiKey, params, store, embeddings, verbose, callbacks}: WebSearchParams) {
        super({verbose, callbacks});

        if (!apiKey) {
            throw new Error(
                "BING_API_KEY key not set."
            );
        }

        this.embeddings = embeddings;
        this.key = apiKey;
        this.params = params;
        this.store = store;
    }

    /** @ignore */
    async _call(query: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        query = query.replace(/^"(.+(?="$))"$/, '$1');

        const headers = {"Ocp-Apim-Subscription-Key": this.key};
        const params = {q: query, textDecorations: "true", textFormat: "HTML", count: "20"};
        const searchUrl = new URL("https://api.bing.microsoft.com/v7.0/search");

        Object.entries(params).forEach(([key, value]) => {
            searchUrl.searchParams.append(key, value);
        });

        const response = await fetch(searchUrl, {headers});

        if (!response.ok) {
            await runManager?.handleToolError(`HTTP error ${response.status}`);
            throw new Error(`HTTP error ${response.status}`);
        }

        const res = await response.json();
        const results: { name: string, snippet: string, url: string }[] = res?.webPages ? res.webPages.value : [];

        if (results.length === 0) {
            await runManager?.handleText("No useful results found.");
            return "No useful results found.";
        }

        const links = results.map(result => `[${result.name}](${result.url}) - ${result.snippet}`);

        if (this.store) {
            const memories = await this.store.retrieveSnippets(query, 0.75, 1);
            if (memories && memories.length > 0) {  // Check if memories is not null and has at least one element
                const memory = memories[0];
                links.push(`[${memory.metadata.name}](${memory.metadata.url}) - ${memory.pageContent}`);
            }
        }

        // this is short-term memory for searching on the page:
        const vectorStore = await MemoryVectorStore.fromTexts(
            links,
            [],
            this.embeddings
        );
        const similar = await vectorStore.similaritySearch(query, 4);

        return similar.map((res) => res.pageContent).join("\n");
    }
}