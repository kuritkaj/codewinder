import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import CodeSandboxControls from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxControls";
import { CodeSandboxDependencies } from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxDependencies";
import CodeSandboxLayout from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxLayout";
import { REACTIVE_NOTEBOOK_TRANSFORMERS } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/MarkdownTransformers";
import { EditorView } from "@codemirror/view";
import {
    SANDBOX_TEMPLATES,
    SandpackCodeEditor,
    SandpackConsole,
    SandpackPredefinedTemplate,
    SandpackPreview,
    SandpackProvider
} from "@codesandbox/sandpack-react";
import { $convertToMarkdownString } from "@lexical/markdown";
import { LexicalEditor } from "lexical";
import React, { memo, useLayoutEffect, useState } from "react";
import styles from "./CodeSandbox.module.css";

const CSS = `
html, body {
    background: #070809;
    color: snow;
}
    
body {
    font-family: sans-serif;
    -webkit-font-smoothing: auto;
    -moz-font-smoothing: auto;
    -moz-osx-font-smoothing: grayscale;
    font-smoothing: auto;
    text-rendering: optimizeLegibility;
    font-smooth: always;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
}

h1 {
    font-size: 1.5rem;
}
`;

const HTML = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Parcel Sandbox</title>
        <meta charset="UTF-8" />
        <link rel="stylesheet" href="styles.css" />
    </head>
    <body>

    <body>
        <div id="app"></div>
    </body>
</html>
`;

export type CodeSandboxProps = {
    code: string;
    editor: LexicalEditor;
    language: string;
    onCodeChange?: (code: string, editor: LexicalEditor) => void;
}

export const CodeSandbox = ({code: init, editor, language, onCodeChange}: CodeSandboxProps) => {
    const {namespace} = useNamespace();
    const {getBlock, replaceBlock} = useNotebook();
    const [code, setCode] = useState<string>(init);
    const [readonly, setReadonly] = useState<boolean>(false);
    const [showPreview, setShowPreview] = useState<boolean>(true);

    useLayoutEffect(() => {
        // Slight delay to let the codesandbox register an editable editor, which can then be made readonly if needed.
        setTimeout(() => setReadonly(!editor.isEditable()), 500);
        return editor.registerEditableListener((editable) => {
            setReadonly(!editable);
        });
    }, [editor]);

    function togglePreview() {
        setShowPreview(!showPreview);
    }

    return (
        <SandpackProvider
            customSetup={{
                dependencies: CodeSandboxDependencies.reduce((acc, dep) => {
                    acc[dep] = "latest";
                    return acc;
                }, {}),
            }}
            files={{
                [SANDBOX_TEMPLATES[language].main]: {
                    code,
                    active: true,
                },
                "/styles.css": {
                    code: CSS,
                    hidden: true,
                },
                "/index.html": {
                    code: HTML,
                    hidden: true,
                },
            }}
            options={{
                recompileMode: "delayed",
                recompileDelay: 1000,
            }}
            template={language as SandpackPredefinedTemplate}
            theme="dark"
        >
            <CodeSandboxLayout className={styles.layout}>
                <SandpackCodeEditor
                    className={styles.editor}
                    initMode="user-visible"
                    readOnly={readonly}
                    showLineNumbers
                    showInlineErrors
                    showReadOnly={false}
                    wrapContent
                    extensions={[
                        EditorView.updateListener.of((value) => {
                            const content = value.state.doc.toString();
                            // Set internal code variable to avoid losing the content when the editor is refreshed
                            setCode(content);

                            // Update block so that the content is saved to the notebook
                            editor.getEditorState().read(() => {
                                const block = getBlock(namespace);
                                if (!block) return;
                                replaceBlock({
                                    ...block,
                                    markdown: $convertToMarkdownString(REACTIVE_NOTEBOOK_TRANSFORMERS)
                                }, true);
                            });

                            // Notify listener
                            if (onCodeChange) onCodeChange(content, editor);
                        })
                    ]}
                />
                <CodeSandboxControls
                    className={styles.controls}
                    language={language}
                    togglePreview={togglePreview}
                />
                <SandpackPreview
                    className={styles.preview}
                    hidden={!showPreview}
                    showOpenInCodeSandbox={false}
                    showRefreshButton
                />
                <SandpackConsole
                    className={styles.console}
                    maxMessageCount={1}
                    resetOnPreviewRestart={true}
                />
            </CodeSandboxLayout>
        </SandpackProvider>
    );
}

CodeSandbox.whyDidYouRender = true;

export default memo(CodeSandbox);