import { VectorStore } from "langchain/dist/vectorstores/base";
import { TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export class MemoryStore {
    memory: VectorStore;
    textSplitter: TextSplitter;

    constructor(memory: VectorStore) {
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

    static async makeLongTermStore(embeddings: OpenAIEmbeddings) {
        const supabaseApiKey = process.env.SUPABASE_API_KEY;
        if (!Boolean(supabaseApiKey)) {
            throw new Error('Supabase api key not found.');
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        if (!Boolean(supabaseUrl)) {
            throw new Error('Supabase url not found.');
        }

        const client = createClient(supabaseUrl, supabaseApiKey);
        const memory = await SupabaseVectorStore.fromExistingIndex(embeddings, {
            client,
            tableName: "documents",
            queryName: "match_documents",
        });

        return new MemoryStore(memory);
    }

    static async makeShortTermStore(embeddings: OpenAIEmbeddings) {
        const memory = await new MemoryVectorStore(embeddings);
        return new MemoryStore(memory);
    }

    async retrieve(query: string, k?: number, filter?: VectorStore["FilterType"] | undefined): Promise<Document[]> {
        return await this.memory.similaritySearch(query, k, filter);
    }

    async storeDocuments(documents: Document[]) {
        await this.memory.addDocuments(documents);
    }

    async storeText(text: string) {
        const documents = await this.textSplitter.createDocuments([ text ], [{ created: new Date()}] );
        await this.memory.addDocuments(documents);
    }
}