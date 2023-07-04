import { $createCodeSandboxNode } from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxNode";
import { CodeNode } from "@lexical/code";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isRootNode, $setSelection } from "lexical";
import React, { useEffect } from 'react';

export default function CodeSandboxPlugin(): React.JSX.Element | null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.registerNodeTransform(CodeNode, (node) => {
            const parentNode = node.getParent();

            // Skip inline CodeNodes
            if ($isRootNode(parentNode)) {
                $setSelection(null);
                const sandbox = $createCodeSandboxNode(
                    node.getLanguage(),
                    node.getTextContent(),
                );
                node.replace(sandbox);
            }
        });
    }, [editor]);

    return null;
}