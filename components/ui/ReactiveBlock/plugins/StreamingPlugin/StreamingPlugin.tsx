// OnChange modified from: https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/LexicalOnChangePlugin.ts

import { REACTIVE_NOTEBOOK_TRANSFORMERS } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/MarkdownTransformers";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorState, LexicalEditor } from "lexical";
import { useLayoutEffect, useRef } from "react";

export type StreamingPluginProps = {
    markdown?: string;
    onChange?: (
        markdown: string,
        editorState: EditorState,
        editor: LexicalEditor,
        tags: Set<string>,
    ) => void;
}

export function StreamingPlugin({markdown, onChange}: StreamingPluginProps) {
    const [editor] = useLexicalComposerContext();
    const canUpdateRef = useRef<boolean>(true);

    useLayoutEffect(() => {
        canUpdateRef.current = false;
        if (markdown) {
            editor.update(() => {
                $convertFromMarkdownString(markdown, REACTIVE_NOTEBOOK_TRANSFORMERS);
            }, {
                onUpdate: () => {
                    canUpdateRef.current = true;
                }
            });
        }
        if (onChange) {
            return editor.registerUpdateListener(({
                editorState,
                dirtyElements,
                dirtyLeaves,
                prevEditorState,
                tags
            }) => {
                if (!canUpdateRef.current) {
                    return;
                }
                if ((dirtyElements.size === 0 && dirtyLeaves.size === 0) || (tags.has('history-merge')) || prevEditorState.isEmpty()) {
                    return;
                }
                editorState.read(() => {
                    const newdown = $convertToMarkdownString();
                    onChange(newdown, editorState, editor, tags);
                });
            });
        }
    }, [editor, markdown, onChange]);

    return null;
}

export default StreamingPlugin;