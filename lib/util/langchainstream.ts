import { AIStreamCallbacks, createCallbacksTransformer } from "ai";

export function Langchainstream(callbacks?: AIStreamCallbacks) {
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

    const sendError = async (error: any) => {
        await writer.ready;
        await writer.abort(error);
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
                //await sendLine();
            },
            handleLLMEnd: async (_output: any) => {
                await sendLine();
            },
            handleLLMError: async (error: Error) => {
                await sendError(error);
            },
            handleChainStart: async (_chain: any, _inputs: any) => {
                //await sendLine();
            },
            handleChainEnd: async (_outputs: any) => {
                //await sendLine();
            },
            handleChainError: async (error: Error) => {
                await sendError(error);
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
                //await sendLine();
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
            sendError: async (error: any) => {
                await sendError(error);
            },
        }
    }
}