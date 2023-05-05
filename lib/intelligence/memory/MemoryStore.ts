import { VectorStore } from "langchain/dist/vectorstores/base";
import { RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
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
            tableName: "memories",
            queryName: "match_memories",
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

    async retrieveSnippet(query: string, threshold): Promise<Document[]> {
        // search the memory for the top 1 document that matches the query
        const docsWithScores = await this.memory.similaritySearchWithScore(query, 1);
        if (docsWithScores.length === 0) return [];

        // convert the response from similaritySearchWithScore to a tuple of [Document, number]
        const docWithScore: [Document, number] = docsWithScores.pop();
        const doc = docWithScore[0];
        const score = docWithScore[1];

        // if doc score is less than threshold, return empty array signifying no match
        if (score > threshold) return [];

        // use the RecursiveCharacterTextSplitter to split the doc into chunks of 1000 characters
        // in theory, this does a good job of breaking on sentences...
        const snippetSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 10,
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


    async storeDocuments(documents: Document[]) {
        await this.memory.addDocuments(documents);
    }

    async storeText(text: string, metadata: Record<string, any>[] = []) {
        const documents = await this.textSplitter.createDocuments([ text ], [...metadata, { created: new Date()}] );
        await this.memory.addDocuments(documents);
    }
}