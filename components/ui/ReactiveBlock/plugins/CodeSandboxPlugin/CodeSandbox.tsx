import CodeSandboxLayout from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxLayout";
import { EditorView } from "@codemirror/view";
import {
    SANDBOX_TEMPLATES,
    SandpackCodeEditor,
    SandpackConsole,
    SandpackPredefinedTemplate,
    SandpackPreview,
    SandpackProvider
} from "@codesandbox/sandpack-react";
import { LexicalEditor } from "lexical";
import React, { useLayoutEffect, useState } from "react";

export type CodeSandboxProps = {
    code: string;
    editor: LexicalEditor;
    language: string;
    onCodeChange?: (code: string, editor: LexicalEditor) => void;
}

export const CodeSandbox = ({code: init, editor, language, onCodeChange}: CodeSandboxProps) => {
    const [code, setCode] = useState<string>(init);
    const [readonly, setReadonly] = useState<boolean>(false);

    useLayoutEffect(() => {
        setReadonly(!editor.isEditable());
        return editor.registerEditableListener((editable) => {
            setReadonly(!editable);
        });
    }, [editor]);

    return (
        <SandpackProvider
            template={language as SandpackPredefinedTemplate}
            theme="dark"
            files={{
                [SANDBOX_TEMPLATES[language].main]: {
                    code,
                    active: true,
                },
            }}
        >
            <CodeSandboxLayout>
                <SandpackCodeEditor
                    showLineNumbers
                    initMode="user-visible"
                    showReadOnly={true}
                    wrapContent={true}
                    readOnly={readonly}
                    extensions={[
                        EditorView.updateListener.of((value) => {
                            const content = value.state.doc.toString();
                            setCode(content);
                            if (onCodeChange) onCodeChange(content, editor);
                        })
                    ]}
                />
                <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                />
                <SandpackConsole
                    maxMessageCount={1}
                />
            </CodeSandboxLayout>
        </SandpackProvider>
    );
}