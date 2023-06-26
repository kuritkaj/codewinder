import useSettings from "@/components/context/useSettings";
import InputTextArea from "@/components/ui/InputTextArea";
import MessageList from "@/components/ui/MessageList";
import { Message } from "@/lib/types/Message";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ChatPanel.module.css";

const ChatPanel = () => {
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

    const messageListRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Auto scroll chat to bottom
    useEffect(() => {
        const messageList = messageListRef.current;
        if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
        }
    }, [messageState.messages, messageState.pending]);

    // Focus on text field on load
    useEffect(() => {
        if (!loading) textAreaRef.current?.focus();
    }, [loading]);

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
        setMessageState(state => ({...state, pending: ""}));

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
                <MessageList chatMessages={chatMessages} loading={loading}/>
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

export default ChatPanel;