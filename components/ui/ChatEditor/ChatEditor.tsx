import useSettings from "@/components/context/useSettings";
import styles from "@/components/ui/ChatPanel/ChatPanel.module.css";
import InputTextArea from "@/components/ui/InputTextArea";
import { Message } from "@/lib/types/Message";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const MarkdownEditor = dynamic(() => import('@/components/ui/MarkdownEditor'), {
    ssr: false,
})

const ChatEditor = () => {
    const [loading, setLoading] = useState(false);
    const [messageState, setMessageState] = useState<{ messages: Message[], pending?: string, context: [string, string][] }>({
        messages: [{
            "message": "Hi there! How can I help?",
            "type": "apiMessage"
        }],
        context: []
    });
    const {usePower} = useSettings();
    const [userInput, setUserInput] = useState("");


    const handleError = () => {
        setMessageState(state => ({
            ...state,
            messages: [...state.messages, {
                type: "apiMessage",
                message: "Oops! There seems to be an error. Please try again.",
            }],
            pending: undefined
        }));

        setLoading(false);
        setUserInput("");
    }

    // Handle form submission
    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const objective = userInput.trim();
        if (objective === "") {
            return;
        }

        setMessageState(state => ({
            ...state,
            messages: [...state.messages, {
                type: "userMessage",
                message: objective
            }],
            pending: undefined
        }));

        setLoading(true);
        setUserInput("");

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                objective,
                context: messageState.context,
                usePower: usePower,
            })
        });

        if (!response.ok) {
            handleError();
            throw new Error(response.statusText);
        }

        // This data is a ReadableStream
        const data = response.body;
        if (!data) return;

        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const {value, done: doneReading} = await reader.read();
            done = doneReading;
            const data = decoder.decode(value, {stream: true});

            // clear the textarea if the data contains {clear}
            if (data.trim().includes("{clear}")) {
                setMessageState(state => ({
                    ...state,
                    pending: undefined,
                }));
            }

            // if the data contains {clear}, just output the string after that phrase.
            const chunk = data.split("{clear}").pop();
            setMessageState(state => ({
                ...state,
                pending: (state.pending ?? "") + chunk,
            }));
        }

        setMessageState(state => ({
            context: [...state.context, [objective, state.pending ?? ""]],
            messages: [...state.messages, {
                type: "apiMessage",
                message: state.pending ?? "",
            }],
            pending: undefined
        }));

        setLoading(false);
        setUserInput("");
    }

    // Prevent blank submissions and allow for multiline input
    const handleEnter = (e: any) => {
        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                handleSubmit(e).then();
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    const chatMessages: Message[] = useMemo(() => {
        return [...messageState.messages, ...(messageState.pending ? [{type: "apiMessage" as const, message: messageState.pending}] : [])];
    }, [messageState.messages, messageState.pending]);

    return (
        <>
            <div className={styles.chatmessages}>
                <MarkdownEditor markdown={"hello!!"} loading={loading}/>
            </div>
            <div className={styles.textinput}>
                <InputTextArea
                    userInput={userInput}
                    setUserInput={setUserInput}
                    handleSubmit={handleSubmit}
                    handleEnter={handleEnter}
                    loading={loading}
                />
            </div>
        </>
    );
}

export default ChatEditor;