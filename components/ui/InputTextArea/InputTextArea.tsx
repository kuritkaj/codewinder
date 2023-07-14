import { PaperPlaneIcon } from "@radix-ui/react-icons";
import React, { useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./InputTextArea.module.css";

type InputTextAreaProps = {
    userInput: string;
    setUserInput: (input: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleEnter: (e: React.KeyboardEvent) => void;
    loading: boolean;
}

const InputTextArea: React.FC<InputTextAreaProps> = ({
    userInput,
    setUserInput,
    handleSubmit,
    handleEnter,
    loading
}) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Focus on text field on load
    useEffect(() => {
        if (!loading) textAreaRef.current?.focus();
    }, [loading]);

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <TextareaAutosize
                className={styles.textarea}
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                minRows={1}
                maxRows={5}
                id="userInput"
                name="userInput"
                placeholder={loading ? "Waiting for response..." : "Send a message..."}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
            />
            {loading ? (
                <div className={styles.loading} aria-busy="true" aria-describedby="progress">
                    <div id="progress" className={styles.progress}>
                        <div className={styles.indicator}></div>
                    </div>
                </div>
            ): (
                <button
                    type="submit"
                    className={styles.generate}
                    disabled={loading}
                >
                    <PaperPlaneIcon/>
                </button>
            )}
        </form>
    );
};

export default InputTextArea;
