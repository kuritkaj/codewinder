type StreamOptions = {
    context?: string[][];
    objective: string;
    onClose?: () => void;
    onOpen?: () => void;
    onError?: (error: Error) => void;
    onMessage?: (message: string) => void;
    usePower?: boolean;
}

export const streamIntelligence = async ({context = [], objective, onClose, onError, onMessage, onOpen, usePower = false}: StreamOptions) => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            objective,
            context,
            usePower,
        })
    });

    onOpen();

    if (!response.ok) {
        onError(new Error(response.statusText));
        onClose();
        return;
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
        onClose();
        return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
        const {value, done: doneReading} = await reader.read();
        done = doneReading;
        const data = decoder.decode(value, {stream: true});
        onMessage(data);
    }

    onClose();
}