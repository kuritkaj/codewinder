import { Tool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { JavascriptEvaluator } from "@/lib/intelligence/tools/JavascriptEvaluator";
import { MultistepTool } from "@/lib/intelligence/tools/MultistepTool";
import { BingSearch } from "@/lib/intelligence/tools/BingSearch";
import { BingNews } from "@/lib/intelligence/tools/BingNews";
import { AgentExecutor } from "@/lib/intelligence/react/AgentExecutor";
import { Callbacks } from "langchain/callbacks";
import { WebBrowser }from "@/lib/intelligence/tools/WebBrowser";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const MAX_ITERATIONS = 8;

export const makeToolChain = async (callbacks: Callbacks): Promise<AgentExecutor> => {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!Boolean(openAIApiKey)) {
        throw new Error('OpenAI API Key not found.');
    }
    const bingApiKey = process.env.BING_API_KEY;

    const model = new ChatOpenAI({
        openAIApiKey,
        temperature: 0,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });
    const creative = new ChatOpenAI({
        openAIApiKey,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    const embeddings = new OpenAIEmbeddings({ openAIApiKey });
    const memory = await MemoryStore.makeMemoryStore(embeddings);

    const tools: Tool[] = [
        new WebBrowser({ model, embeddings, callbacks }),
        new JavascriptEvaluator()
    ];
    if (Boolean(bingApiKey)) {
        tools.push(new BingSearch({ apiKey: bingApiKey, callbacks }));
        tools.push(new BingNews({ apiKey: bingApiKey, callbacks }));
    }
    const multistep = new MultistepTool({ model, memory, creative, tools, callbacks, maxIterations: MAX_ITERATIONS});
    const toolset = [...tools, multistep];

    const agent = ReActAgent.makeAgent(model, memory, toolset, callbacks);

    const executor = AgentExecutor.fromAgentAndTools({
        agent,
        tools: toolset,
        verbose: true,
        callbacks,
        maxIterations: MAX_ITERATIONS
    });

    console.log("Loaded agent.");

    return executor;
}