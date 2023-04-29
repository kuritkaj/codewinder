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

    constructor(memory: VectorStore, textSplitter: TextSplitter) {
        this.memory = memory;
        this.textSplitter = textSplitter;
    }

    static async makeMemoryStore(embeddings: OpenAIEmbeddings) {
        const supabaseApiKey = process.env.SUPABASE_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;

        let memory;
        if (Boolean(supabaseApiKey) && Boolean(supabaseUrl)) {
            console.log("Using Supabase vector store.");

            const client = createClient(supabaseUrl, supabaseApiKey);
            memory = await SupabaseVectorStore.fromExistingIndex(embeddings, {
                client,
                tableName: "documents",
                queryName: "match_documents",
            });
        } else {
            console.log("Using memory vector store.");
            memory = await new MemoryVectorStore(embeddings);
        }

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

        const textSplitter = new TokenTextSplitter({
            chunkSize,
            chunkOverlap: Math.round(chunkSize / 10),
        });

        return new MemoryStore(memory, textSplitter);
    }

    async retrieve(query: string, k?: number, filter?: VectorStore["FilterType"] | undefined): Promise<Document[]> {
        return await this.memory.similaritySearch(query, k, filter);
    }

    async storeDocuments(documents: Document[]) {
        await this.memory.addDocuments(documents);
    }

    async storeText(text: string) {
        const documents = await this.textSplitter.createDocuments([ text ]);
        await this.memory.addDocuments(documents);
    }
}