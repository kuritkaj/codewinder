import { SupabaseVectorStore } from "@/lib/intelligence/vectorstores/SupabaseVectorStore";
import { Metadata } from "@/lib/types/Document";
import { getEmbeddingContextSize } from "@/lib/util/tokens";
import { createClient } from "@supabase/supabase-js";
import { VectorStore } from "langchain/dist/vectorstores/base";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export class MemoryStore {
    private readonly index: string;
    private readonly memory: VectorStore;
    private readonly textSplitter: TextSplitter;

    constructor(memory: VectorStore, index: string) {
        this.index = index;
        this.memory = memory;

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

    public static async makeDurableStore(index: string, embeddings: OpenAIEmbeddings) {
        const supabaseApiKey = process.env.SUPABASE_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;

        if (typeof supabaseApiKey === 'string' && supabaseApiKey.length > 0 &&
            typeof supabaseUrl === 'string' && supabaseUrl.length > 0)
        {
            const client = createClient(supabaseUrl, supabaseApiKey, {
                auth: {
                    persistSession: false
                },
            });
            const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
                client,
                tableName: index,
                queryName: `match_${index}`,
            });

            return new MemoryStore(vectorStore, index);
        } else {
            console.log("No Supabase API Key or URL found.");
            return this.makeTransientStore(index, embeddings);
        }
    }

    public static async makeTransientStore(index: string, embeddings: OpenAIEmbeddings) {
        const memory = await new MemoryVectorStore(embeddings);
        return new MemoryStore(memory, index);
    }

    public async retrieve(query: string, k?: number, filter?: VectorStore["FilterType"] | undefined): Promise<Document[]> {
        if (!query) throw new Error("A query is required.");
        return await this.memory.similaritySearch(query, k, filter);
    }

    public async retrieveSnippets(query: string, threshold, k: number = 1): Promise<Document[]> {
        if (!query) throw new Error("A query is required.");

        // search the memory for the top 1 document that matches the query
        const docsWithScores = await this.memory.similaritySearchWithScore(query, k);
        if (docsWithScores.length === 0) return [];

        // use the RecursiveCharacterTextSplitter to split the doc into chunks of 1000 characters
        // in theory, this does a good job of breaking on sentences...
        const snippetSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 100,
        });

        let snippets: Document[] = [];

        for (const docWithScore of docsWithScores) {
            // convert the response from similaritySearchWithScore to a tuple of [Document, number]
            const doc = docWithScore[0];
            const score = docWithScore[1];

            // if doc score is less than threshold, return empty array signifying no match
            if (score < threshold) break;

            // if doc score is greater than threshold, search the doc for the single snippet that best matches the query
            const texts = await snippetSplitter.splitText(doc.pageContent);
            const vectorStore = await MemoryVectorStore.fromTexts(
                texts,
                doc.metadata,
                this.memory.embeddings
            );

            // search the vector store for the best single match
            const snippet = await vectorStore.similaritySearch(query, 1);

            // We shouldn't have to do this, but the whole url is not preserved from the MemoryVectorStore.
            if (snippet.length > 0) snippets.push(snippet[0]);
        }

        return snippets;
    }

    // public async storeDocuments(documents: Document[], metadata: Metadata = {}) {
    //     metadata.created_at = new Date(); // Patch in the current date/time for future reference
    //
    //     if (!documents || documents.length === 0) throw new Error("Documents are required.");
    //     // Add created date to metadata for all documents
    //     for (const document of documents) {
    //         document.metadata = metadata;
    //     }
    //     await this.memory.addDocuments(documents);
    // }

    public async storeTexts(texts: string[], metadata: Metadata = {}) {
        metadata.created_at = new Date(); // Patch in the current date/time for future reference

        if (!texts || texts.length === 0) throw new Error("Texts are required.");
        const documents = await this.textSplitter.createDocuments(
            texts
        );
        for (const document of documents) {
            document.metadata = metadata;
        }
        await this.memory.addDocuments(documents);
    }
}