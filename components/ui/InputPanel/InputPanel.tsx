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
    const {appendToBlock, addBlock, getContents, replaceBlock} = useNotebook();

    // Prevent blank submissions and allow for multiline input
    const handleEnter = async (e: any) => {
        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                await handleSubmit(userInput);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    const handleSubmit = async (input: string) => {
        const objective = input.trim();
        if (objective === "") {
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
            objective,
            onClose,
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
                handleSubmit={async () => { await handleSubmit(userInput); }}
                handleEnter={handleEnter}
                loading={loading}
            />
        </div>
    );
};

export default InputPanel;