import { Tool, ToolParams } from "langchain/tools";

export interface BingNewsArgs extends ToolParams {
    apiKey: string | undefined;
    params?: Record<string, string>;
}

export class BingNews extends Tool {
    name = "news-search";

    description = `
A news search engine. Useful for when you need to find headlines and news articles on trending topics.
Input should be a search query.
    `;

    readonly key: string;
    readonly params: Record<string, string>;

    constructor({ apiKey, params }: BingNewsArgs) {
        super();

        if (!apiKey) {
            throw new Error(
                "BingNewsKey API key not set. You can set it as BingApiKey in your .env file."
            );
        }

        this.key = apiKey;
        this.params = params;
    }

    /** @ignore */
    async _call(input: string): Promise<string> {
        input = input.replace(/^"(.+(?="$))"$/, '$1');

        const headers = { "Ocp-Apim-Subscription-Key": this.key };
        const params = { q: input, textDecorations: "true", textFormat: "HTML" };
        const searchUrl = new URL("https://api.bing.microsoft.com/v7.0/news/search");

        Object.entries(params).forEach(([key, value]) => {
            searchUrl.searchParams.append(key, value);
        });

        const response = await fetch(searchUrl, { headers });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const res = await response.json();
        const results: [] = res.value;

        if (results.length === 0) {
            return "No useful results found.";
        }

        return results
            .map((result: { name: string, description: string, url: string }) => `${result.name} ${result.description} ${result.url}`)
            .join(" ");
    }
}