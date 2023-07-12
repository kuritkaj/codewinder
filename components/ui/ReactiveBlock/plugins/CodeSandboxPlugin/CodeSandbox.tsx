import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import CodeSandboxControls from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxControls";
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

    useLayoutEffect(() => {
        // Slight delay to let the codesandbox register an editable editor, which can then be made readonly if needed.
        setTimeout(() => setReadonly(!editor.isEditable()), 500);
        return editor.registerEditableListener((editable) => {
            setReadonly(!editable);
        });
    }, [editor]);

    return (
        <SandpackProvider
            customSetup={{
                dependencies: {
                    "plotly.js-dist-min": "latest",
                },
            }}
            files={{
                [SANDBOX_TEMPLATES[language].main]: {
                    code,
                    active: true,
                },
            }}
            options={{
                recompileMode: "delayed",
                recompileDelay: 1000,
            }}
            template={language as SandpackPredefinedTemplate}
            theme="dark"
        >
            <CodeSandboxLayout>
                <SandpackCodeEditor
                    initMode="user-visible"
                    readOnly={readonly}
                    showLineNumbers
                    showInlineErrors
                    showReadOnly
                    wrapContent
                    extensions={[
                        EditorView.updateListener.of((value) => {
                            const content = value.state.doc.toString();
                            // Set internal code variable to avoid losing the content when the editor is refreshed
                            setCode(content);

                            // Update block so that the content is saved to the notebook
                            editor.getEditorState().read(() => {
                                const block = getBlock(namespace);
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
                <CodeSandboxControls/>
                <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton
                />
                <SandpackConsole
                    maxMessageCount={1}
                />
            </CodeSandboxLayout>
        </SandpackProvider>
    );
}

CodeSandbox.whyDidYouRender = true;

export default memo(CodeSandbox);