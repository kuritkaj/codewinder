import Progress from "@/components/ui/common/Progress";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import Button from "components/ui/common/Button";
import React, { useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./InputTextArea.module.css";

type InputTextAreaProps = {
    userInput: string;
    setUserInput: (input: string) => void;
    handleSubmit: (input: string) => void;
    loading: boolean;
}

const InputTextArea: React.FC<InputTextAreaProps> = ({
    userInput,
    setUserInput,
    handleSubmit,
    loading
}) => {
    const isSubmitting = useRef(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Focus on text field on load
    useEffect(() => {
        if (!loading) textAreaRef.current?.focus();
    }, [loading]);

    // Prevent blank submissions and allow for multiline input
    const handleEnter = async (e: any) => {
        if (isSubmitting.current) return;

        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                e.preventDefault();
                isSubmitting.current = true;
                await handleSubmit(userInput);
                isSubmitting.current = false;
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    return (
        <form className={styles.form}>
            <TextareaAutosize
                className={styles.textarea}
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                minRows={1}
                maxRows={5}
                id="chatInput"
                name="chatInput"
                placeholder={loading ? "Waiting for response..." : "Send a message..."}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
            />
            {loading ? (
                <Progress width={200}/>
            ) : (
                <Button
                    aria-label="Chat with AI"
                    className={styles.generate}
                    disabled={loading}
                    onClick={async () => {
                        isSubmitting.current = true;
                        await handleSubmit(userInput);
                        isSubmitting.current = false;
                    }}
                >
                    <PaperPlaneIcon width={16} height={16}/>
                </Button>
            )}
        </form>
    );
};

export default InputTextArea;
