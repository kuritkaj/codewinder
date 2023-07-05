import CodeSandboxLayout from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxLayout";
import { SANDBOX_TEMPLATES, SandpackCodeEditor, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react/types";
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import React, { ReactNode } from "react";
import styles from "./CodeSandbox.module.css";

export type SerializedCodeSandboxNode = Spread<
    {
        code: string | null | undefined;
        language: string | null | undefined;
    },
    SerializedLexicalNode
>;

export class CodeSandboxNode extends DecoratorNode<ReactNode> {

    private readonly code: string | null | undefined;
    private readonly language: string | null | undefined;

    constructor(language?: string, code?: string, key?: NodeKey) {
        super(key);

        this.code = code;
        this.language = language;
    }

    public static clone(node: CodeSandboxNode): CodeSandboxNode {
        return new CodeSandboxNode(node.__key);
    }

    public static getType(): string {
        return "codesandbox";
    }

    public static importJSON(serializedNode: SerializedCodeSandboxNode): CodeSandboxNode {
        return $createCodeSandboxNode(serializedNode.language, serializedNode.code);
    }

    createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
        const sandbox = document.createElement("div");
        sandbox.classList.add(styles.codesandbox);
        return sandbox;
    }

    public decorate(): ReactNode {
        let mapped = Object.keys(SANDBOX_TEMPLATES).find(key => key === this.language);
        if ("javascript" === this.language) mapped = "vanilla";
        if ("typescript" === this.language) mapped = "vanilla-ts";
        if (["html", "css", "scss", "sass", "less", "json", "markdown", "md", "mdx"].includes(this.language)) {
            mapped = "static";
        }
        if (!mapped) mapped = "static";

        return (
            <SandpackProvider
                template={mapped as SandpackPredefinedTemplate}
                theme="dark"
                files={{
                    [SANDBOX_TEMPLATES[mapped].main]: {
                        code: this.code,
                        active: true,
                    },
                }}
            >
                <CodeSandboxLayout className={styles.layout}>
                    <SandpackCodeEditor
                        showLineNumbers
                        initMode="user-visible"
                    />
                    <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton={true}
                    />
                </CodeSandboxLayout>
            </SandpackProvider>
        );
    }

    public exportJSON(): SerializedCodeSandboxNode {
        return {
            type: CodeSandboxNode.getType(),
            version: 1,
            code: this.code,
            language: this.language,
        };
    }

    public updateDOM(): false {
        return false;
    }
}

export function $createCodeSandboxNode(language?: string, code?: string): CodeSandboxNode {
    return new CodeSandboxNode(language, code);
}

export function $isCodeSandboxNode(node: LexicalNode | null | undefined): node is CodeSandboxNode {
    return node instanceof CodeSandboxNode;
}