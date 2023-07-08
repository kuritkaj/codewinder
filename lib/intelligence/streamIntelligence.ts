type StreamOptions = {
    context?: string[][];
    localKey?: string;
    objective: string;
    onClose?: () => void;
    onOpen?: () => void;
    onError?: (error: Error) => void;
    onMessage?: (message: string) => void;
    usePower?: boolean;
}

type StreamControl = {
    stop: () => void;
}

/**
 * This function is used to stream intelligence from the server.
 * @returns A function that can be called to stop the stream.
 */
export const streamIntelligence = async ({
    context = [],
    localKey,
    objective,
    onClose,
    onError,
    onMessage,
    onOpen,
    usePower = false
}: StreamOptions): Promise<StreamControl> => {

    let abortController: AbortController | null = new AbortController();
    const stop = () => {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
                localKey,
                objective,
                context,
                usePower,
            })
        });

        if (onOpen) onOpen();

        if (!response.ok) {
            if (onError) onError(new Error(response.statusText));
            return;
        }

        // This data is a ReadableStream
        const data = response.body;
        if (!data) {
            if (onError) onError(new Error("No data returned"));
            return;
        }

        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const {value, done: doneReading} = await reader.read();
            done = doneReading;
            const data = decoder.decode(value, {stream: true});
            if (onMessage) onMessage(data);

            // The request has been aborted, stop reading the stream.
            if (abortController === null) {
                await reader.cancel();
                break;
            }
        }

        abortController = null

    } catch (error) {
        // Ignore abort errors as they are expected.
        if ((error as any).name === 'AbortError') {
            abortController = null;
            return null;
        }

        if (onError && error instanceof Error) {
            onError(error);
        }
    } finally {
        if (onClose) onClose();
    }

    return { stop };
}