import * as cheerio from "cheerio";
import { BaseLanguageModel } from "langchain/base_language";
import { Tool, ToolParams } from "langchain/tools";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { StringPromptValue } from "langchain/prompts";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { Document } from "langchain/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "langchain/embeddings";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";

const DESCRIPTION = `finding or summarizing webpage content from a valid URL, such as follow up from a web search.
Input should be "ONE valid http URL including protocol","what to find on the page". Leave the second input blank to summarize the page.
The tool input should use this format:
{{
  "action": "tool name",
  "action_input": ["https://www.google.com","how to make a cake"]
}}`;

export const getText = (
    html: string,
    baseUrl: string,
    summary: boolean
): { text: string, title: string } => {
    // scriptingEnabled so noscript elements are parsed
    const $ = cheerio.load(html, { scriptingEnabled: true });

    let text = "";

    // let's only get the body if it's a summary, don't need to summarize header or footer etc
    const rootElement = summary ? "body " : "*";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(`${ rootElement }:not(style):not(script):not(svg)`).each((_i, elem: any) => {
        // we don't want duplicated content as we drill down so remove children
        let content = $(elem).clone().children().remove().end().text().trim();
        const $el = $(elem);

        // if it's an ahref, print the content and url
        let href = $el.attr("href");
        if ($el.prop("tagName")?.toLowerCase() === "a" && href) {
            if (!href.startsWith("http")) {
                try {
                    href = new URL(href, baseUrl).toString();
                } catch {
                    // if this fails that's fine, just no url for this
                    href = "";
                }
            }

            const imgAlt = $el.find("img[alt]").attr("alt")?.trim();
            if (imgAlt) {
                content += ` ${ imgAlt }`;
            }

            text += ` [${ content }](${ href })`;
        }
        // otherwise just print the content
        else if (content !== "") {
            text += ` ${ content }`;
        }
    });

    const cleansed = text.trim().replace(/\n+/g, " ");
    const title = $("title").text().trim();
    return { text: cleansed, title };
};

const getHtml = async (
    baseUrl: string,
    h: Headers
) => {
    const domain = new URL(baseUrl).hostname;

    const headers = { ...h };
    // these appear to be positional, which means they have to exist in the headers passed in
    headers["Host"] = domain;
    headers["Alt-Used"] = domain;

    let htmlResponse;
    try {
        htmlResponse = await fetch(baseUrl, {
            method: "GET",
            headers,
        });
    } catch (e) {
        if (e.response && e.response.status) {
            throw new Error(`http response ${ e.response.status }`);
        }
        throw e;
    }

    return await htmlResponse.text();
};

const DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.google.com/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Headers = Record<string, any>;

export interface WebBrowserParams extends ToolParams {
    embeddings: Embeddings;
    headers?: Headers;
    memory?: MemoryStore;
    model: BaseLanguageModel;
}

export class WebBrowser extends Tool {
    readonly name = "web-browser";
    readonly description = DESCRIPTION;

    readonly embeddings: Embeddings;
    readonly headers: Headers;
    readonly memory: MemoryStore;
    readonly model: BaseLanguageModel;

    constructor({
                    model,
                    memory,
                    embeddings,
                    headers,
                    verbose,
                    callbacks,
                }: WebBrowserParams) {
        super(verbose, callbacks);

        this.embeddings = embeddings;
        this.headers = headers || DEFAULT_HEADERS;
        this.memory = memory;
        this.model = model;
    }

    /** @ignore */
    async _call(inputs: string, runManager?: CallbackManagerForToolRun) {
        const [ baseUrl, task ] = inputs.split(",").map((input) => {
            let t = input.trim();
            t = t.startsWith('[') ? t.slice(1) : t;
            t = t.startsWith('"') ? t.slice(1) : t;
            t = t.endsWith("]") ? t.slice(0, -1) : t;
            t = t.endsWith('"') ? t.slice(0, -1) : t;
            // it likes to put / at the end of urls, won't matter for task
            t = t.endsWith("/") ? t.slice(0, -1) : t;
            return t.trim();
        });
        const doSummary = !task;

        let text;
        let title;
        try {
            const html = await getHtml(baseUrl, this.headers);
            const result = getText(html, baseUrl, doSummary);
            text = result.text;
            title = result.title;
        } catch (e) {
            if (e) {
                return e.toString();
            }
            return "There was a problem connecting to the site";
        }

        // Store the full text for later retrieval
        if (this.memory) await this.memory.storeText(text, [ { name: title }, { url: baseUrl } ]);

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,
            chunkOverlap: 200,
        });
        const texts = await textSplitter.splitText(text);

        let context;
        // if we want a summary grab first 4
        if (doSummary) {
            context = texts.slice(0, 4).join("\n");
        }
        // search term well embed and grab top 4
        else {
            const docs = texts.map(
                (pageContent) =>
                    new Document({
                        pageContent,
                        metadata: [],
                    })
            );

            // this is short-term memory for searching on the page:
            const vectorStore = await MemoryVectorStore.fromDocuments(
                docs,
                this.embeddings
            );
            const results = await vectorStore.similaritySearch(task, 4);

            context = results.map((res) => res.pageContent).join("\n");
        }

        const prompt = `Text:${ context }\n\nI need ${
            doSummary ? "a summary" : task
        } from the provided text. Limit to 200 words.`;

        const completion = await this.model.generatePrompt(
            [ new StringPromptValue(prompt) ],
            undefined,
            runManager?.getChild()
        );

        return completion.generations[0][0].text;
    }
}