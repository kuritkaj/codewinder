// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/tools/webbrowser.ts

import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import * as cheerio from "cheerio";
import { BaseLanguageModel } from "langchain/base_language";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Embeddings } from "langchain/embeddings";
import { StringPromptValue } from "langchain/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { StructuredTool, ToolParams } from "langchain/tools";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { z } from "zod";

export const NAME = "browser";
export const DESCRIPTION = `finding or summarizing webpage or PDF content from a provided url.`;

const getContent = async (
    baseUrl: string,
    h: Headers
): Promise<string | Blob> => {
    const domain = new URL(baseUrl).hostname;

    const headers = {...h};
    // these appear to be positional, which means they have to exist in the headers passed in
    headers["Host"] = domain;
    headers["Alt-Used"] = domain;

    let response: Response;
    try {
        response = await fetch(baseUrl, {
            method: "GET",
            headers,
        });
    } catch (e) {
        if (e.response && e.response.status) {
            throw new Error(`http response ${e.response.status}`);
        }
        throw e;
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/html")) {
        return await response.text();
    } else if (contentType?.includes("application/pdf")) {
        return await response.blob();
    } else {
        throw new Error("Unsupported content type.");
    }
};

async function getPdf(content: Blob): Promise<{ text: string, title: string }> {
    const pdf = new PDFLoader(content, {splitPages: false});
    try {
        const pdfData = await pdf.load();
        const pdfExtract = pdfData.shift();
        const pdfText = pdfExtract?.pageContent || "Empty document";
        const pdfTitle = pdfExtract?.metadata?.title || "Untitled";

        return {
            title: pdfTitle,
            text: pdfText
        };
    } catch (error) {
        // Handle any parsing errors
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse the PDF.");
    }
}

export const getText = (
    html: string,
    baseUrl: string,
    summary: boolean
): { text: string, title: string } => {
    // scriptingEnabled so noscript elements are parsed
    const $ = cheerio.load(html);

    let text = "";

    // let's only get the body if it's a summary, don't need to summarize header or footer etc
    const rootElement = summary ? "body " : "*";

    $(`${rootElement}:not(style):not(script):not(svg)`).each((_i, elem: any) => {
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
                content += ` ${imgAlt}`;
            }

            text += ` [${content}](${href})`;
        }
        // otherwise just print the content
        else if (content !== "") {
            text += ` ${content}`;
        }
    });

    const cleansed = text.trim().replace(/\n+/g, " ");
    const title = $("title").text().trim();
    return {text: cleansed, title};
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

type Headers = Record<string, any>;

export interface WebBrowserParams extends ToolParams {
    embeddings: Embeddings;
    headers?: Headers;
    model: BaseLanguageModel;
    store?: MemoryStore;
}

export class WebBrowser extends StructuredTool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;
    public readonly schema = z.object({
        baseUrl: z.string().describe("one valid url"),
        task: z.string().describe("what to find on the page")
    });

    private readonly embeddings: Embeddings;
    private readonly headers: Headers;
    private readonly model: BaseLanguageModel;
    private readonly store?: MemoryStore;

    constructor({
        model,
        store,
        embeddings,
        headers,
        verbose,
        callbacks,
    }: WebBrowserParams) {
        super({verbose, callbacks});

        this.embeddings = embeddings;
        this.headers = headers || DEFAULT_HEADERS;
        this.model = model;
        this.store = store;
    }

    async _call(instructions: z.output<this["schema"]>, runManager?: CallbackManagerForToolRun) {
        let {baseUrl, task} = instructions;

        const doSummary = !task;

        let text: string;
        let title: string;
        try {
            const content = await getContent(baseUrl, this.headers);
            if (content instanceof Blob) {
                const result = await getPdf(content);
                text = result.text;
                title = result.title;
            } else {
                const result = getText(content, baseUrl, doSummary);
                text = result.text;
                title = result.title;
            }
        } catch (e) {
            if (e) {
                return e.toString();
            }
            return "There was a problem connecting to the site.";
        }

        // Store the full text for later retrieval
        if (this.store) await this.store.storeTexts([text], {name: title, url: baseUrl}); // async

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,
            chunkOverlap: 200,
        });
        const texts = await textSplitter.splitText(text);

        const limit = 20;
        let context: string;
        // if we want a summary grab first 6
        if (doSummary) {
            context = texts.slice(0, limit).join("\n");
        }
        // search term well embed and grab top 6
        else {
            // this is short-term memory for searching on the page:
            const vectorStore = await MemoryVectorStore.fromTexts(
                texts,
                [],
                this.embeddings,
            );
            const similar = await vectorStore.similaritySearch(task, limit);
            context = similar.map((res) => res.pageContent).join("\n");
        }

        const prompt = `Text:${context}\n\nPlease ${
            doSummary ? "summarize" : task
        } the provided text. Be succinct and only include information that's relevant to the task.
        If present in the provided text, include relevant formatted markdown links to support your answer.`;

        const completion = await this.model.generatePrompt(
            [new StringPromptValue(prompt)],
            undefined,
            runManager?.getChild()
        );

        return completion.generations[0][0].text;
    }
}