// OnChange modified from: https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/LexicalOnChangePlugin.ts

import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import { REACTIVE_NOTEBOOK_TRANSFORMERS } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/MarkdownTransformers";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useLayoutEffect } from "react";

export const StreamingPlugin = () => {
    const [editor] = useLexicalComposerContext();
    const {namespace} = useNamespace();
    const {getBlock, replaceBlock, subscribeToBlock} = useNotebook();

    function updateEditor(editor, markdown) {
        editor.update(() => {
            $convertFromMarkdownString(markdown, REACTIVE_NOTEBOOK_TRANSFORMERS);
        });
    }

    useEffect(() => {
        const block = getBlock(namespace);
        updateEditor(editor, block.markdown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only update on the initial render

    useEffect(() => {
        return subscribeToBlock(namespace, (newBlock) => {
            updateEditor(editor, newBlock.markdown);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only subscribe on the initial render

    useLayoutEffect(() => {
        return editor.registerUpdateListener(({
            editorState,
            dirtyElements,
            dirtyLeaves,
            prevEditorState,
            tags
        }) => {
            if ((dirtyElements.size === 0 && dirtyLeaves.size === 0) ||
                (tags.has('history-merge')) ||
                prevEditorState.isEmpty()
            ) {
                return;
            }
            editorState.read(() => {
                const block = getBlock(namespace);
                replaceBlock({
                    ...block,
                    markdown: $convertToMarkdownString(REACTIVE_NOTEBOOK_TRANSFORMERS)
                }, true);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only register on the initial render

    return null;
}

export default StreamingPlugin;