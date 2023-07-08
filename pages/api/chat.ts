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

    try {
        const {stream, handlers} = Langchainstream();
        const chain = await makeChain({
            callbacks: [handlers], localKey, usePower
        });

        handlers.sendData("Thinking...").then();
        chain.predict({
            objective,
            context
        }).then((completion: string) => {
            handlers.sendClear();
            handlers.sendData(completion);
        }).catch((e) => {
            handlers.sendError(e);
        }).finally(() => {
            handlers.closeStream();
        });

        return streamToResponse(stream, res)
    } catch (error: any) {
        console.error(error);
    }
}

export default Service;