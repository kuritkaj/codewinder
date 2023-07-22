"use client";

import Button from "components/ui/common/Button";
import styles from "@/components/ui/Search/Search.module.css";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

type SearchProps = {
    handleSubmit: (input: string) => void;
}

const Search = ({handleSubmit}: SearchProps) => {
    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState("");

    // Prevent blank submissions and allow for multiline input
    const handleEnter = async (e: any) => {
        if (loading) return;

        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                e.preventDefault();
                setLoading(true);
                await handleSubmit(userInput);
                setLoading(false);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    return (
        <form className={styles.searchcontainer}>
            <TextareaAutosize
                className={styles.searchinput}
                autoFocus={true}
                minRows={1}
                maxRows={5}
                id="chatInput"
                name="chatInput"
                placeholder="What would you like to do?"
                value={userInput}
                onKeyDown={handleEnter}
                onChange={e => setUserInput(e.target.value)}
            />
            <Button
                aria-label="Chat with AI"
                className={styles.searchbutton}
                disabled={loading}
                onClick={async () => {
                    setLoading(true);
                    await handleSubmit(userInput);
                    setLoading(false);
                }}
            >
                <PaperPlaneIcon width={16} height={16}/>
            </Button>
        </form>
    );
}

export default Search;