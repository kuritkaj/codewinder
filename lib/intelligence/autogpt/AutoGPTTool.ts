import { DynamicTool, DynamicToolInput, Tool } from "langchain/tools";
import { AutoGPT, AutoGPTOutputParser } from "langchain/experimental/autogpt";
import { BaseChatModel } from "langchain/chat_models";
import { VectorStore } from "langchain/vectorstores";
import { VectorStoreRetriever } from "langchain/vectorstores/base";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

interface PlannerInput {
    llm: BaseChatModel;
    tools: Tool[];
    name?: string;
    description?: string;
    returnDirect?: boolean;
    verbose?: boolean;
    callbacks?: DynamicToolInput["callbacks"];
}

class AutoGPTTool extends DynamicTool {

    llm: BaseChatModel;
    tools: Tool[];

    constructor(options?: PlannerInput) {
        super({
            name: options?.name || "autogpt",
            description: options?.description || "This tool enables the AI Assistant to plan out a series of actions to achieve a goal.",
            func: async (input: string): Promise<string> => {
                const plan = await AutoGPTTool.makeAgent(this.llm, this.tools).run([input]);
                return `${plan}`;
            },
            returnDirect: options?.returnDirect ?? false,
            verbose: options?.verbose ?? false,
            callbacks: options?.callbacks,
        });

        this.llm = options.llm;
        this.tools = options.tools;
    }

    static makeAgent(llm: BaseChatModel, tools: Tool[]): AutoGPT {
        const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());

        return AutoGPT.fromLLMAndTools(
            llm,
            tools,
            {
                aiName: "autogpt",
                aiRole: "autogpt",
                memory: new VectorStoreRetriever<VectorStore>({ vectorStore }),
                maxIterations: 10,
                outputParser: new AutoGPTOutputParser(),
            }
        );
    }
}
