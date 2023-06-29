import React from "react";
import styles from "./MarkdownEditor.module.css";

interface MarkdownEditorProps {
    loading: boolean;
    markdown: string;
}

export const MarkdownEditor = ({markdown}: MarkdownEditorProps) => {
    const node = React.useRef<HTMLDivElement>(null);

    const setEditorNode = (element: HTMLDivElement) => {
        node.current = element;
    }

    return (
        <div className={styles.markdowneditor} ref={setEditorNode}/>
    );
}

export default MarkdownEditor;