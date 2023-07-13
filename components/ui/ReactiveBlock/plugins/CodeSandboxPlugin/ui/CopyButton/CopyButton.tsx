import BaseButton from "@/components/ui/BaseButton";
import { useActiveCode } from "@codesandbox/sandpack-react";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import React, { MouseEventHandler, useState } from "react";
import styles from "./CopyButton.module.css";

const CopyButton = () => {
    const [copySuccess, setCopySuccess] = useState(false);
    const {code} = useActiveCode();

    const copyToClipboard: MouseEventHandler<HTMLButtonElement> = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000); // revert back after 2 seconds
        });
    };

    return (
        <BaseButton className={styles.button} onClick={copyToClipboard}>
            <ClipboardCopyIcon/>
            <span>{copySuccess ? "Copied!" : "Copy code"}</span>
        </BaseButton>
    );
};

export default CopyButton;