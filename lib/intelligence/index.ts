import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { MultistepExecutor } from "@/lib/intelligence/multistep/MultistepExecutor";
import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { ReActExecutor } from "@/lib/intelligence/react/ReActExecutor";
import { CodeExecutor } from "@/lib/intelligence/tools/CodeExecutor";
import { PlanAndSolve } from "@/lib/intelligence/tools/PlanAndSolve";
import { WebBrowser } from "@/lib/intelligence/tools/WebBrowser";
import { WebSearch } from "@/lib/intelligence/tools/WebSearch";
import { Callbacks } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StructuredTool } from "langchain/tools";

export const makeChain = async ({callbacks}: { callbacks: Callbacks }): Promise<ReActExecutor> => {
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!Boolean(openAiApiKey)) {
        throw new Error('OpenAI api key not found.');
    }
    const bingApiKey = process.env.BING_API_KEY;
    // const zapierApiKey = process.env.ZAPIER_NLA_API_KEY;

    // This should represent intelligence that is great at determiing the best tool to use.
    const predictable = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        modelName: "gpt-4-0613",
        temperature: 0,
        topP: 0,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    // This should represent intelligence that is great at parsing long texts.
    const capable = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        modelName: "gpt-3.5-turbo-16k-0613",
        temperature: 0.1,
        topP: 0,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2,
        maxTokens: 200
    });

    // This should represent intelligence that is great at writing code.
    const powerful = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        modelName: "gpt-4-0613",
        temperature: 0.5,
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    // This should represent intelligence that is creative.
    const creative = new ChatOpenAI({
        openAIApiKey: openAiApiKey,
        temperature: 0.7,
        modelName: "gpt-3.5-turbo-16k-0613",
        streaming: Boolean(callbacks),
        callbacks,
        maxRetries: 2
    });

    const embeddings = new OpenAIEmbeddings({openAIApiKey: openAiApiKey});
    const store = await MemoryStore.makeDurableStore("memories", embeddings);
    const knowledge = await MemoryStore.makeDurableStore("knowledge", embeddings);
    const code = await MemoryStore.makeDurableStore("code", embeddings);

    const tools: StructuredTool[] = [
        new WebBrowser({callbacks, embeddings, memory: knowledge, model: capable}),
        new CodeExecutor({callbacks, memory: code, model: powerful}),
    ];
    if (Boolean(bingApiKey)) {
        tools.push(new WebSearch({apiKey: bingApiKey, callbacks, embeddings, memory: knowledge}));
    }
    // if (Boolean(zapierApiKey)) {
    //     const zapier = new ZapierNLAWrapper({apiKey: zapierApiKey});
    //     const toolkit = await ZapierToolKit.fromZapierNLAWrapper(zapier);
    //     tools.push(...toolkit.tools);
    // }

    const multistepExecutor = new MultistepExecutor({
        callbacks,
        creative,
        predictable,
        store,
        tools,
        verbose: true,
    })
    const toolkit = [...tools];
    toolkit.push(new PlanAndSolve({callbacks, multistepExecutor, verbose: true}));

    const agent = ReActAgent.fromLLMAndTools({
        callbacks,
        predictable,
        tools: toolkit,
        verbose: true,
    });
    return ReActExecutor.fromAgentAndTools({
        agent,
        callbacks,
        tools: toolkit,
        verbose: true,
    });
}

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