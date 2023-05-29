import { Tool } from "langchain/tools";
import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { JavascriptEvaluator } from "@/lib/intelligence/tools/JavascriptEvaluator";
import { BingSearch } from "@/lib/intelligence/tools/BingSearch";
import { Callbacks } from "langchain/callbacks";
import { WebBrowser } from "@/lib/intelligence/tools/WebBrowser";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Multistep } from "@/lib/intelligence/multistep/Multistep";
import { MemoryRecall } from "@/lib/intelligence/tools/MemoryRecall";
import { MemoryStorage } from "@/lib/intelligence/tools/MemoryStorage";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ReActExecutor } from "@/lib/intelligence/react/ReActExecutor";

const MAX_ITERATIONS = 10;

export const makeChain = async ({ callbacks }: { callbacks: Callbacks }): Promise<ReActExecutor> => {
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!Boolean(openAiApiKey)) {
        throw new Error('OpenAI api key not found.');
    }
    const bingApiKey = process.env.BING_API_KEY;
    // const replicateApiKey = process.env.REPLICATE_API_KEY;
    //
    // const predictable = new Replicate({
    //     apiKey: replicateApiKey,
    //     model: "replicate/vicuna-13b:e6d469c2b11008bb0e446c3e9629232f9674581224536851272c54871f84076e",
    //     input: {
    //         temperature: 0.1,
    //         max_length: 4096,
    //     },
    //     callbacks
    // });

    // This is GPT3.5 with temp of 0
    const predictable = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        temperature: 0,
        topP: 0.1,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    // This is GPT4all with temp of 0
    // const predictable = new OpenAI({
    //     modelName: "wizardLM-7B.q4_2",
    //     temperature: 0,
    //     streaming: Boolean(callbacks),
    //     callbacks,
    //     maxRetries: 2,
    //     verbose: true,
    // }, {
    //     basePath: "http://127.0.0.1:4891/v1",
    // });

    // This is GPT4 with temp of 0.5
    const powerful = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        temperature: 0.5,
        modelName: 'gpt-4',
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    // This is GPT4 with temp of 0.7 (which is the default)
    const creative = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        temperature: 0.7,
        modelName: 'gpt-4',
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAiApiKey });
    const memory = process.env.SUPABASE_URL ?
        await MemoryStore.makeDurableStore("memories", embeddings) :
        await MemoryStore.makeTransientStore(embeddings);

    const tools: Tool[] = [
        // new LocalBrowser({ model: capable }),
        // new CreativeWriter({ model: creative, callbacks }),
        new WebBrowser({ model: predictable, memory, embeddings, callbacks }),
        new JavascriptEvaluator({ model: powerful, callbacks }),
        new MemoryRecall({ model: predictable, memory }),
        new MemoryStorage({ model: predictable, memory, embeddings })
    ];
    if (Boolean(bingApiKey)) {
        tools.push(new BingSearch({ apiKey: bingApiKey, embeddings, callbacks }));
    }
    const multistep = new Multistep({
        callbacks,
        creative,
        maxIterations: MAX_ITERATIONS,
        model: predictable,
        memory,
        tools
    });
    const toolset = [ ...tools, multistep ];

    const agent = ReActAgent.makeAgent({
        callbacks,
        creative,
        maxIterations: MAX_ITERATIONS,
        memory,
        model: predictable,
        tools
    });

    // The Executor gets all tools including the multistep, since that's a tool that could be returned by the ReActAgent
    // (see ReActAgentOutputParser). However, the ReActAgent itself does not get the multistep, so that it's not selected directly.
    return ReActExecutor.fromAgentAndTools({
        agent,
        callbacks,
        maxIterations: MAX_ITERATIONS,
        tools: toolset,
        verbose: true
    });
}