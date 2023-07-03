import InputTextArea from "@/components/ui/InputTextArea";
import ReactiveNotebook from "@/components/ui/ReactiveNotebook";
import { BlockData, EditableNotebook, PartialBlockData } from "@/components/ui/ReactiveNotebook/ReactiveNotebook";
import { streamIntelligence } from "@/lib/intelligence/streamIntelligence";
import React, { useRef, useState } from "react";
import styles from "./NotebookPanel.module.css";

const NotebookPanel = () => {
    const notebookRef = useRef<EditableNotebook>();

    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState("");

    const addBlock = (block: BlockData) => {
        notebookRef.current.addBlock(block);
    }

    const appendBlock = (partial: PartialBlockData) => {
        notebookRef.current.appendBlock(partial);
    }

    const replaceBlock = (partial: PartialBlockData) => {
        notebookRef.current.replaceBlock(partial);
    }

    // Handle form submission
    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const objective = userInput.trim();
        if (objective === "") {
            return;
        }

        addBlock({
            markdown: objective,
            namespace: Math.random().toString(),
            type: "usermessage"
        });

        setLoading(true);
        setUserInput("");

        const onClose = () => {
            setLoading(false);
            setUserInput("");
        }

        const onMessage = (partial: PartialBlockData) => {
            if (partial.markdown.includes("{clear}")) {
                replaceBlock({
                    ...partial,
                    markdown: partial.markdown.split("{clear}").pop() || "",
                });
            } else {
                appendBlock(partial);
            }
        }

        const onOpen = (partial: PartialBlockData) => {
            addBlock({...partial, editable: false, type: "apimessage"});
        }

        const namespace = Math.random().toString();
        await streamIntelligence({
            objective,
            onClose,
            onOpen: () => {
                onOpen({markdown: "", namespace})
            },
            onMessage: (message) => {
                onMessage({markdown: message, namespace})
            }
        });
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

    return (
        <>
            <div className={styles.notebook}>
                <ReactiveNotebook ref={notebookRef}/>
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

export default NotebookPanel;