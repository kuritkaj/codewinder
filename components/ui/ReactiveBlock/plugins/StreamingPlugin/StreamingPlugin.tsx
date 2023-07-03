import { REACTIVE_NOTEBOOK_TRANSFORMERS } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/MarkdownTransformers";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLayoutEffect } from "react";

export function StreamingPlugin({markdown}: { markdown: string }) {
    const [editor] = useLexicalComposerContext();

    // Pass editor to callback
    useLayoutEffect(() => {
        editor.update(() => {
            $convertFromMarkdownString(markdown, REACTIVE_NOTEBOOK_TRANSFORMERS);
        });
    }, [editor, markdown]);

    return null;
}

export default StreamingPlugin;