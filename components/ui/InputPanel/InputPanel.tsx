import useNotebook from "@/components/context/useNotebook";
import useSettings from "@/components/context/useSettings";
import InputTextArea from "@/components/ui/InputTextArea";
import { streamIntelligence } from "@/lib/intelligence/streamIntelligence";
import { PartialBlockData } from "@/lib/types/BlockData";
import { MessageType } from "@/lib/types/MessageType";
import { useState } from "react";
import styles from "./InputPanel.module.css";

const InputPanel = () => {
    const [loading, setLoading] = useState(false);
    const {usePower} = useSettings();
    const [userInput, setUserInput] = useState("");
    const {addBlock, appendToBlock, getContents, replaceBlock} = useNotebook();
    const {hasServerKey, localKey} = useSettings();

    // Prevent blank submissions and allow for multiline input
    const handleEnter = async (e: any) => {
        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                await handleSubmit(e, userInput);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e: any, input: string) => {
        e.preventDefault();

        const objective = input.trim();
        if (objective === "") {
            return;
        }

        if (!hasServerKey && !localKey) {
            addBlock({
                editable: false,
                markdown: "You must set an OpenAI API key.",
                namespace: Math.random().toString(),
                type: MessageType.ApiMessage
            });
            return;
        }

        setUserInput("");

        addBlock({
            editable: false,
            markdown: objective,
            namespace: Math.random().toString(),
            type: MessageType.UserMessage
        });

        setLoading(true);

        const onClose = () => {
            setLoading(false);
        }

        const onError = (partial: PartialBlockData) => {
            replaceBlock({
                editable: false,
                namespace: partial.namespace,
                markdown: partial.markdown,
                type: MessageType.ApiMessage,
            });
        }

        const onMessage = (partial: PartialBlockData) => {
            if (partial.markdown.includes("{clear}")) {
                replaceBlock({
                    editable: false,
                    namespace: partial.namespace,
                    markdown: partial.markdown.split("{clear}").pop() || "",
                    type: MessageType.ApiMessage,
                });
            } else {
                appendToBlock(partial);
            }
        }

        const onOpen = (partial: PartialBlockData) => {
            addBlock({...partial, editable: false, type: MessageType.ApiMessage});
        }

        const context = getContents();
        const namespace = Math.random().toString();
        await streamIntelligence({
            context,
            localKey,
            objective,
            onClose,
            onError: (error) => {
                onError({markdown: error.message, namespace})
            },
            onOpen: () => {
                onOpen({markdown: "", namespace})
            },
            onMessage: (message) => {
                onMessage({markdown: message, namespace})
            },
            usePower
        });
    }

    return (
        <div className={styles.textinput}>
            <InputTextArea
                userInput={userInput}
                setUserInput={setUserInput}
                handleSubmit={async (e) => { await handleSubmit(e, userInput); }}
                handleEnter={handleEnter}
                loading={loading}
            />
        </div>
    );
};

export default InputPanel;