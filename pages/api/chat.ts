// Based on: https://github.com/sullivan-sean/chat-langchainjs/blob/main/pages/api/chat-stream.ts

import { makeChain } from "@/lib/intelligence/makeChain";
import { CallbackManager } from "langchain/callbacks";
import { NextApiHandler } from "next";

const Service: NextApiHandler = async (req, res) => {
    const { context, objective, usePower }: { context: [ string, string ][], objective: string, usePower: boolean } = await req.body;

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        // Important to set no-transform to avoid compression, which will delay
        // writing response chunks to the client.
        // See https://github.com/vercel/next.js/issues/9965
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
    });

    const sendClear = () => {
        res.write("{clear}");
    }

    const sendData = (data: string) => {
        res.write(data);
    };

    const sendLine = (data?: string) => {
        sendData(`\n\n${ data ? data : '' }`);
    }

    const sendError = (error: string) => {
        res.status(500).write(`\n\n${ error }`);
    }

    const callbacks = CallbackManager.fromHandlers({
        handleLLMStart: () => {
            sendLine();
        },
        handleLLMNewToken: async (token) => {
            sendData(token);
        },
        handleLLMEnd: () => {
            sendLine();
        },
        handleText: (text: string) => {
            sendData(text);
        },
        handleToolStart: (tool, input) => {
            sendLine(`\`\`\`${tool.id[tool.id.length - 1]}: ${input}\`\`\`\n\n`);
        },
        handleToolEnd: async () => {
            sendLine();
        },
        handleLLMError: async (error) => {
            sendError(error);
        },
    });

    const chain = await makeChain({ callbacks, usePower });

    try {
        sendLine("Thinking...");
        const completion = await chain.predict({
            objective,
            context
        });
        sendClear();
        sendLine(completion);
    } catch (error) {
        sendError(error)
    } finally {
        res.end();
    }
}

export default Service;