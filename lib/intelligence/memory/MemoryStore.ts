import { VectorStore } from "langchain/dist/vectorstores/base";
import { RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { createClient } from "@supabase/supabase-js";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { SupabaseVectorStore } from "@/lib/intelligence/vectorstores/SupabaseVectorStore";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import * as path from "path";
import * as fs from "fs";

export const CACHE_DIR = ".cache";

export class MemoryStore {
    private readonly index: string;
    private readonly memory: VectorStore;
    private readonly textSplitter: TextSplitter;

    constructor(memory: VectorStore, index: string) {
        this.index = index;
        this.memory = memory;

        const getEmbeddingContextSize = (modelName?: string): number => {
            switch (modelName) {
                case "text-embedding-ada-002":
                    return 8191;
                default:
                    return 2046;
            }
        };
        const chunkSize = getEmbeddingContextSize(
            "modelName" in memory.embeddings
                ? (memory.embeddings.modelName as string)
                : undefined
        );

        this.textSplitter = new TokenTextSplitter({
            chunkSize,
            chunkOverlap: Math.round(chunkSize / 10),
        });
    }

    static async makeDurableStore(index: string, embeddings: OpenAIEmbeddings) {
        const supabaseApiKey = process.env.SUPABASE_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;

        if (Boolean(supabaseApiKey) && Boolean(supabaseUrl)) {
            const client = createClient(supabaseUrl, supabaseApiKey);
            const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
                client,
                tableName: index,
                queryName: `match_${ index }`,
            });

            return new MemoryStore(vectorStore, index);
        } else {
            const directory = path.join(process.cwd(), CACHE_DIR, index);
            if (!fs.existsSync(directory)) fs.mkdirSync(directory);

            let vectorStore: HNSWLib;
            if (fs.readdirSync(directory).length > 0) {
                vectorStore = await HNSWLib.load(directory, embeddings);
            } else {
                vectorStore = await HNSWLib.fromTexts(["initialize"], {}, embeddings);
                await vectorStore.save(directory);
            }
            return new MemoryStore(vectorStore, index);
        }
    }

    static async makeTransientStore(index: string, embeddings: OpenAIEmbeddings) {
        const memory = await new MemoryVectorStore(embeddings);
        return new MemoryStore(memory, index);
    }

    async retrieve(query: string, k?: number, filter?: VectorStore["FilterType"] | undefined): Promise<Document[]> {
        if (!query) throw new Error("A query is required.");
        return await this.memory.similaritySearch(query, k, filter);
    }

    async retrieveSnippet(query: string, threshold): Promise<Document[]> {
        if (!query) throw new Error("A query is required.");

        // search the memory for the top 1 document that matches the query
        const docsWithScores = await this.memory.similaritySearchWithScore(query, 1);
        if (docsWithScores.length === 0) return [];

        // convert the response from similaritySearchWithScore to a tuple of [Document, number]
        const docWithScore: [Document, number] = docsWithScores.pop();
        const doc = docWithScore[0];
        const score = docWithScore[1];

        // if doc score is less than threshold, return empty array signifying no match
        if (score < threshold) return [];

        // use the RecursiveCharacterTextSplitter to split the doc into chunks of 1000 characters
        // in theory, this does a good job of breaking on sentences...
        const snippetSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 100,
        });

        // if doc score is greater than threshold, search the doc for the single snippet that best matches the query
        const texts = await snippetSplitter.splitText(doc.pageContent);
        const vectorStore = await MemoryVectorStore.fromTexts(
            texts,
            doc.metadata,
            this.memory.embeddings
        );

        // search the vector store for the best single match
        return await vectorStore.similaritySearch(query, 1);
    }

    private async save() {
        const directory = path.join(process.cwd(), CACHE_DIR, this.index);

        if (this.memory instanceof HNSWLib) {
            await this.memory.save(directory);
        }
    }

    async storeDocuments(documents: Document[], metadata: Record<string, any>[] = []) {
        if (!documents || documents.length === 0) throw new Error("Documents are required.");
        // Add created date to metadata for all documents
        for (const document of documents) {
            document.metadata = [...metadata, { created: new Date()}]
        }
        await this.memory.addDocuments(documents);
        await this.save();
    }

    async storeTexts(texts: string[], metadata: Record<string, any>[] = []) {
        if (!texts || texts.length === 0) throw new Error("Texts are required.");
        const documents = await this.textSplitter.createDocuments(
            texts
        );
        for (const document of documents) {
            document.metadata = [...metadata, { created: new Date()}]
        }
        await this.memory.addDocuments(documents);
        await this.save();
    }
}