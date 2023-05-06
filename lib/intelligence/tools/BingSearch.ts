import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { StringPromptValue } from "langchain/prompts";
import { BaseLanguageModel } from "langchain/base_language";

export interface BingSearchParams extends ToolParams {
    apiKey: string | undefined;
    memory?: MemoryStore;
    model: BaseLanguageModel;
    params?: Record<string, string>;
}

export class BingSearch extends Tool {
    readonly name = "web-search";
    readonly description = "find answers on the web. Input is a string for a web search query.";

    readonly key: string;
    readonly memory: MemoryStore;
    readonly model: BaseLanguageModel;
    readonly params: Record<string, string>;

    constructor({ apiKey, params, model, memory, verbose, callbacks }: BingSearchParams) {
        super(verbose, callbacks);

        if (!apiKey) {
            throw new Error(
                "BING_API_KEY key not set."
            );
        }

        this.key = apiKey;
        this.memory = memory;
        this.model = model;
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

        const links = results.map(result => `[${ result.name }](${ result.url }) - ${ result.snippet }`).join("\n");

        const prompt = `Given this input: ${ input }
            And these search results (name, url, snippet): ${ links }
            Return a list of 4 or 5 markdown links \`* [name](url) - snippet\` that are most relevant to the query.`;

        const completion = await this.model.generatePrompt(
            [ new StringPromptValue(prompt) ],
            undefined,
            runManager?.getChild()
        );

        return completion.generations[0][0].text;
    }
}