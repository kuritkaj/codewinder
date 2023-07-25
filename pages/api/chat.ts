// Based on: https://github.com/sullivan-sean/chat-langchainjs/blob/main/pages/api/chat-stream.ts

import { makeChain } from "@/lib/intelligence/makeChain";
import { LangchainStream } from "@/lib/util/langchainStream";
import { streamToResponse } from "ai";
import { OpenAIModerationChain } from "langchain/chains";
import { NextApiHandler } from "next";

type ServiceOptions = {
    context?: [string, string][];
    localKey?: string;
    objective: string;
    usePower?: boolean;
}

const Service: NextApiHandler = async (req, res) => {
    // context should be an array of "[message, type]" pairs, where type is "apimessage" or "usermessage"
    const {context, localKey, objective, usePower}: ServiceOptions = await req.body;

    const openAiApiKey = localKey || process.env.OPENAI_API_KEY;
    if (!Boolean(openAiApiKey)) {
        throw new Error("OpenAI API Key not set.");
    }

    const {stream, handlers} = LangchainStream();
    try {
        const moderation = new OpenAIModerationChain({
            openAIApiKey: openAiApiKey,
            // If set to true, the call will throw an error when the moderation chain detects violating content.
            // If set to false, violating content will return "Text was found that violates OpenAI's content policy."
            throwError: true,
            verbose: true,
        });
        await moderation.run(objective);

        const chain = await makeChain({
            callbacks: [handlers], localKey, usePower
        });

        handlers.sendData("Thinking...").then();
        handlers.sendLine().then();
        chain.predict({
            objective,
            context
        }).then(async (completion: string) => {
            await handlers.sendClear();
            await handlers.sendData(completion);
            await handlers.closeStream();
        }).catch(async (error) => {
            await handlers.sendClear();
            await handlers.sendError(error);
            await handlers.closeStream();
        })

        return streamToResponse(stream, res);
    } catch (error: any) {
        await handlers.sendClear();
        await handlers.sendError(error);
        await handlers.closeStream();
    }
}

export default Service;