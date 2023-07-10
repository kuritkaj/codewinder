import { $createCodeSandboxNode, $isCodeSandboxNode } from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxNode";
import { CodeNode } from "@lexical/code";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isRootNode, $setSelection } from "lexical";
import React, { useEffect } from 'react';

export default function CodeSandboxPlugin(): React.JSX.Element | null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.registerNodeTransform(CodeNode, (node) => {
            if ($isCodeSandboxNode(node)) {
                return;
            }

            // Skip inline CodeNodes
            const parentNode = node.getParent();
            if ($isRootNode(parentNode)) {
                $setSelection(null);
                const sandbox = $createCodeSandboxNode(
                    node.getLanguage(),
                    node.getTextContent(),
                    !editor.isEditable(),
                );
                node.replace(sandbox);
            }
        });
    }, [editor]);

    return null;
}