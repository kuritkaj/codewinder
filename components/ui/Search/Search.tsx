"use client";

import Progress from "@/components/ui/common/Progress";
import styles from "@/components/ui/Search/Search.module.css";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import Button from "components/ui/common/Button";
import React, { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

type SearchProps = {
    handleSubmit: (input: string) => void;
}

const Search = ({handleSubmit}: SearchProps) => {
    const isSubmitting = useRef(false);
    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState("");

    // Prevent blank submissions and allow for multiline input
    const handleEnter = async (e: any) => {
        if (isSubmitting.current) return;

        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                e.preventDefault();
                isSubmitting.current = true;
                setLoading(true);
                await handleSubmit(userInput);
                setLoading(false);
                isSubmitting.current = false;
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    return (
        <form className={styles.searchform}>
            <TextareaAutosize
                className={styles.searchinput}
                autoFocus={true}
                disabled={loading}
                minRows={1}
                maxRows={5}
                id="chatInput"
                name="chatInput"
                placeholder="What would you like to do?"
                value={userInput}
                onKeyDown={handleEnter}
                onChange={e => setUserInput(e.target.value)}
            />
            {loading ? (
                <Progress width={200}/>
            ) : (
                <Button
                    aria-label="Chat with AI"
                    className={styles.searchbutton}
                    disabled={loading}
                    onClick={async () => {
                        if (isSubmitting.current) return;
                        isSubmitting.current = true;
                        setLoading(true);
                        await handleSubmit(userInput);
                        setLoading(false);
                        isSubmitting.current = false;
                    }}
                >
                    <PaperPlaneIcon width={16} height={16}/>
                </Button>
            )}
        </form>
    );
}

export default Search;