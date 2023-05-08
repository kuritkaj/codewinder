import { Tool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { JavascriptEvaluator } from "@/lib/intelligence/tools/JavascriptEvaluator";
import { BingSearch } from "@/lib/intelligence/tools/BingSearch";
import { AgentExecutor } from "@/lib/intelligence/react/AgentExecutor";
import { Callbacks } from "langchain/callbacks";
import { WebBrowser } from "@/lib/intelligence/tools/WebBrowser";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { BingNews } from "@/lib/intelligence/tools/BingNews";
import { MemoryStorage } from "@/lib/intelligence/tools/MemoryStorage";
import { MemoryRecall } from "@/lib/intelligence/tools/MemoryRecall";
import { Multistep } from "@/lib/intelligence/tools/Multistep";

const MAX_ITERATIONS = 8;

export const makeToolChain = async (callbacks: Callbacks): Promise<AgentExecutor> => {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!Boolean(openAIApiKey)) {
        throw new Error('OpenAI api key not found.');
    }
    const bingApiKey = process.env.BING_API_KEY;
    const gpt4 = process.env.GPT4 || "false";
    console.log(`GPT4: ${ gpt4 }`);

    // This is GPT3.5 with temp of 0
    const predictable = new ChatOpenAI({
        openAIApiKey,
        temperature: 0,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });
    // This is GPT4 with temp of 0
    // const capable = new ChatOpenAI({
    //     openAIApiKey,
    //     modelName: Boolean(gpt4) ? 'gpt-4' : 'gpt-3.5-turbo',
    //     temperature: 0,
    //     streaming: Boolean(callbacks),
    //     callbacks,
    //     maxRetries: 2
    // });
    // This is GPT4 with temp of the default
    const creative = new ChatOpenAI({
        openAIApiKey,
        modelName: Boolean(gpt4) ? 'gpt-4' : 'gpt-3.5-turbo',
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    const embeddings = new OpenAIEmbeddings({ openAIApiKey });
    const memory = process.env.SUPABASE_URL ?
        await MemoryStore.makeLongTermStore(embeddings) :
        await MemoryStore.makeShortTermStore(embeddings);

    const tools: Tool[] = [
        new WebBrowser({ model: predictable, embeddings, callbacks }),
        new JavascriptEvaluator(),
        new MemoryRecall({ model: predictable, memory }),
        new MemoryStorage({ model: predictable, memory, embeddings })
    ];
    if (Boolean(bingApiKey)) {
        tools.push(new BingNews({ apiKey: bingApiKey, embeddings, callbacks }));
        tools.push(new BingSearch({ apiKey: bingApiKey, embeddings, callbacks }));
    }
    const multistep = new Multistep({ model: predictable, creative, memory, tools, callbacks, maxIterations: MAX_ITERATIONS });
    const toolset = [ ...tools, multistep ];

    const agent = ReActAgent.makeAgent({ model: predictable, creative, memory, tools: toolset, callbacks });

    return AgentExecutor.fromAgentAndTools({
        agent,
        callbacks,
        maxIterations: MAX_ITERATIONS,
        tools: toolset,
        verbose: true,
    });
}