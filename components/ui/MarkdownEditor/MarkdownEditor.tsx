import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, $getSelection } from "lexical";
import React from "react";
import styles from "./MarkdownEditor.module.css";

interface MarkdownEditorProps {
    loading: boolean;
    markdown: string;
}

export const MarkdownEditor = ({markdown}: MarkdownEditorProps) => {
    // Catch any errors that occur during Lexical updates and log them
    // or throw them as needed. If you don't throw them, Lexical will
    // try to recover gracefully without losing user data.
    function onError(error) {
        console.error(error);
    }

    const theme = {
        // Theme styling goes here
    }

    // When the editor changes, you can get notified via the
    // LexicalOnChangePlugin!
    function onChange(editorState) {
        editorState.read(() => {
            // Read the contents of the EditorState here.
            const root = $getRoot();
            const selection = $getSelection();

            console.log(root, selection);
        });
    }

    const initialConfig = {
        editorState: () => $convertFromMarkdownString(markdown, TRANSFORMERS),
        namespace: "MarkdownEditor",
        theme,
        onError,
    };

    return (
        <div className={styles.markdowneditor}>
            <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin
                    contentEditable={<ContentEditable className={styles.editorinput}/>}
                    placeholder={<div className={styles.placeholder}>...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <OnChangePlugin onChange={onChange}/>
                <HistoryPlugin/>
            </LexicalComposer>
        </div>
    );
}

export default MarkdownEditor;