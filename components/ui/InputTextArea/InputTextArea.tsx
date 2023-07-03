import React, { useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./InputTextArea.module.css";

interface InputTextAreaProps {
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
            <button
                type="submit"
                className={styles.generate}
                disabled={loading}
            >
                {loading ? (
                    <div className={styles.loading} aria-busy="true" aria-describedby="progress-bar">
                        <progress id="progress-bar" aria-label="Thinking…"/>
                    </div>
                ) : (
                    <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns="http://www3.org/2000/svg">
                        <path
                            d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                    </svg>
                )}
            </button>
        </form>
    );
};

export default InputTextArea;
