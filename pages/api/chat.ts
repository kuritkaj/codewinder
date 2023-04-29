import { makeToolChain } from "@/lib/intelligence";
import { CallbackManager } from "langchain/callbacks";
import { NextApiHandler } from "next";

const Service: NextApiHandler = async (req, res) => {
    const { context, objective } = await req.body;

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

    const callbackManager = CallbackManager.fromHandlers({
        handleLLMStart(llm: { name: string }): Promise<void> | void {
            sendLine();
            console.log(`\n\n${ llm.name } started.`);
        },
        handleLLMNewToken: async (token) => {
            sendData(token);
        },
        handleLLMEnd(): Promise<void> | void {
            sendLine();
        },
        handleToolStart() {
            sendLine();
        },
        handleToolEnd: async () => {
            sendLine();
        },
        handleLLMError: async (error) => {
            sendError(error);
        },
    });

    const chain = await makeToolChain(callbackManager);

    try {
        const response = await chain.call({
            objective,
            context: context.map(inner => inner.join("")).join(""),
        });
        sendClear();
        sendLine(response.output);
    } catch (error) {
        sendError(error)
    } finally {
        res.end();
    }
}

export default Service;