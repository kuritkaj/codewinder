import { AIStreamCallbacks, createCallbacksTransformer } from "ai";

export function LangchainStream(callbacks?: AIStreamCallbacks) {
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendClear = async () => {
        await sendData("{clear}");
    }

    const sendData = async (data: string) => {
        await writer.ready;
        await writer.write(data);
    };

    const sendLine = async () => {
        await sendData("<br/><br/>");
    }

    const sendError = async (error: Error) => {
        console.log("Aborting with Error", error);
        await sendData(error.message);
    }

    return {
        stream: stream.readable.pipeThrough(createCallbacksTransformer(callbacks)),
        writer,
        handlers: {
            closeStream: async () => {
                await writer.ready;
                await writer.close();
            },
            handleLLMNewToken: async (token: string) => {
                await sendData(token);
            },
            handleLLMStart: async (_llm: any, _prompts: string[]) => {
            },
            handleLLMEnd: async (_output: any) => {
                await sendLine();
            },
            handleLLMError: async (error: Error) => {
                await sendError(error);
                await sendLine();
            },
            handleChainStart: async (_chain: any, _inputs: any) => {
            },
            handleChainEnd: async (_outputs: any) => {
            },
            handleChainError: async (error: Error) => {
                await sendError(error);
                await sendLine();
            },
            handleText: async (text: string) => {
                await sendData(text);
                await sendLine();
            },
            handleToolStart: async (_tool: any, _input: string) => {
                await sendData(`\`${_tool.id[_tool.id.length - 1]}: ${_input}\``);
                await sendLine();
            },
            handleToolEnd: async (_output: string) => {
            },
            handleToolError: async (error: Error) => {
                await sendError(error);
            },
            sendClear: async () => {
                await sendClear();
            },
            sendData: async (data: string) => {
                await sendData(data);
            },
            sendError: async (error: Error) => {
                await sendError(error);
            },
            sendLine: async () => {
                await sendLine();
            }
        }
    }
}