// Based on: https://github.com/sullivan-sean/chat-langchainjs/blob/main/pages/api/chat-stream.ts

import { makeChain } from "@/lib/intelligence/makeChain";
import { Langchainstream } from "@/lib/util/langchainstream";
import { streamToResponse } from "ai";
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

    const {stream, handlers} = Langchainstream();
    try {
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