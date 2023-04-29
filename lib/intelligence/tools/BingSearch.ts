import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";

export interface BingSearchArgs extends ToolParams {
    apiKey: string | undefined;
    params?: Record<string, string>;
}

export class BingSearch extends Tool {
    name = "web-search";

    description = `
A search engine. Useful for when you need find an answer on the web. Input should be a search query.
    `;

    readonly key: string;
    readonly params: Record<string, string>;

    constructor({ apiKey, params }: BingSearchArgs) {
        super();

        if (!apiKey) {
            throw new Error(
                "BingSerpAPI API key not set. You can set it as BingApiKey in your .env file."
            );
        }

        this.key = apiKey;
        this.params = params;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        input = input.replace(/^"(.+(?="$))"$/, '$1');

        const headers = { "Ocp-Apim-Subscription-Key": this.key };
        const params = { q: input, textDecorations: "true", textFormat: "HTML" };
        const searchUrl = new URL("https://api.bing.microsoft.com/v7.0/search");

        Object.entries(params).forEach(([key, value]) => {
            searchUrl.searchParams.append(key, value);
        });

        const response = await fetch(searchUrl, { headers });

        if (!response.ok) {
            await runManager?.handleToolError(`HTTP error ${response.status}`);
            throw new Error(`HTTP error ${response.status}`);
        }

        const res = await response.json();
        const results: [] = res.webPages.value;

        if (results.length === 0) {
            await runManager?.handleText("No useful results found.");
            return "No useful results found.";
        }

        results.map((result: { name: string, snippet: string, url: string }) => {
            runManager?.handleText(`${result.name} ${result.snippet} ${result.url}`);
        });

        return results
            .map((result: { name: string, snippet: string, url: string }) => `${result.name} ${result.snippet} ${result.url}`)
            .join(" ");
    }
}