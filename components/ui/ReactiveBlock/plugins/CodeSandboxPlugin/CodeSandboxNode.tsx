import CodeSandbox from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandbox";
import { SANDBOX_TEMPLATES } from "@codesandbox/sandpack-react";
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import React, { ReactNode } from "react";
import styles from "./CodeSandboxNode.module.css";

export type SerializedCodeSandboxNode = Spread<
    {
        code: string;
        language: string;
    },
    SerializedLexicalNode
>;

export class CodeSandboxNode extends DecoratorNode<ReactNode> {

    private state: {
        code: string;
        language: string;
    };

    constructor(language?: string, code?: string, readonly?: boolean, key?: NodeKey) {
        super(key);

        this.state = {
            code: code || "",
            language: language || "static",
        }

        // Bind this method to ensure `this` is always the component instance
        this.handleCodeChange = this.handleCodeChange.bind(this);
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

    getTextContent(): string {
        return `\`\`\`${this.state.language}\n${this.state.code}\n\`\`\``;
    }

    getTextContentSize(): number {
        return this.state.code.length;
    }

    createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
        const sandbox = document.createElement("div");
        sandbox.classList.add(styles.codesandbox);
        return sandbox;
    }

    public decorate(editor: LexicalEditor, config: EditorConfig): ReactNode {
        console.log("language", this.state.language);
        let mapped = Object.keys(SANDBOX_TEMPLATES).find(key => key === this.state.language);
        if ("javascript" === this.state.language) mapped = "vanilla";
        if ("typescript" === this.state.language) mapped = "vanilla-ts";
        if ("jsx" === this.state.language) mapped = "react";
        if ("tsx" === this.state.language) mapped = "react";
        if (["html", "css", "scss", "sass", "less", "json", "markdown", "md", "mdx"].includes(this.state.language)) {
            mapped = "static";
        }
        if (!mapped) mapped = "static";
        console.log("mapped", mapped);

        return (
            <CodeSandbox code={this.state.code} editor={editor} language={mapped} onCodeChange={this.handleCodeChange}/>
        );
    }

    public exportJSON(): SerializedCodeSandboxNode {
        return {
            type: CodeSandboxNode.getType(),
            version: 1,
            code: this.state.code,
            language: this.state.language,
        };
    }

    public updateDOM(): boolean {
        return false;
    }

    private handleCodeChange(code: string): void {
        this.state.code = code;
    }
}

export function $createCodeSandboxNode(language?: string, code?: string, readonly?: boolean): CodeSandboxNode {
    return new CodeSandboxNode(language, code, readonly);
}

export function $isCodeSandboxNode(node: LexicalNode | null | undefined): node is CodeSandboxNode {
    return node instanceof CodeSandboxNode;
}