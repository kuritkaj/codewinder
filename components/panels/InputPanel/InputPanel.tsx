import useNotebook from "@/components/context/useNotebook";
import useSettings from "@/components/context/useSettings";
import InputTextArea from "@/components/ui/InputTextArea";
import { streamIntelligence } from "@/lib/intelligence/streamIntelligence";
import { PartialBlockData } from "@/lib/types/BlockData";
import { MessageType } from "@/lib/types/MessageType";
import { generateRandomString } from "@/lib/util/random";
import { useState } from "react";
import styles from "./InputPanel.module.css";

type InputPanelProps = {
    defaultInput?: string;
}

const InputPanel = ({defaultInput = ""}: InputPanelProps) => {
    const [loading, setLoading] = useState(false);
    const {usePower} = useSettings();
    const [userInput, setUserInput] = useState(defaultInput);
    const {addBlock, appendToBlock, getContents, replaceBlock} = useNotebook();

    const handleSubmit = async (input: string) => {
        const objective = input.trim();
        if (objective === "") {
            return;
        }

        setUserInput("");
        setLoading(true);

        addBlock({
            editable: false,
            markdown: objective,
            type: MessageType.UserMessage
        });

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
        const namespace = generateRandomString(10);
        await streamIntelligence({
            context,
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
        <div className={styles.panel}>
            <InputTextArea
                userInput={userInput}
                setUserInput={setUserInput}
                handleSubmit={async () => { await handleSubmit(userInput) }}
                loading={loading}
            />
        </div>
    );
};

export default InputPanel;