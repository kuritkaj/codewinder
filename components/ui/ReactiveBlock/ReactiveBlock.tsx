import { theme } from "@/components/ui/ReactiveBlock/content/theme";
import { CodeSandboxNode } from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxNode";
import CollapsiblePlugin from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin";
import { CollapsibleContainerNode } from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin/CollapsibleContainerNode";
import { CollapsibleContentNode } from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin/CollapsibleContentNode";
import { CollapsibleTitleNode } from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin/CollapsibleTitleNode";
import FloatingTextFormatToolbarPlugin from "@/components/ui/ReactiveBlock/plugins/FloatingTextFormatToolbarPlugin";
import { REACTIVE_NOTEBOOK_TRANSFORMERS } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/MarkdownTransformers";
import StreamingPlugin from "@/components/ui/ReactiveBlock/plugins/StreamingPlugin";
import ToggleEditablePlugin from "@/components/ui/ReactiveBlock/plugins/ToggleEditablePlugin";
import { BlockData } from "@/lib/types/BlockData";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import CodeSandboxPlugin from "components/ui/ReactiveBlock/plugins/CodeSandboxPlugin";
import React, { memo } from "react";
import styles from "./ReactiveBlock.module.css";

const EDITOR_NODES = [
    CollapsibleContainerNode, CollapsibleContentNode, CollapsibleTitleNode,
    CodeNode, CodeSandboxNode, HeadingNode, HorizontalRuleNode, LinkNode,
    ListNode, ListItemNode, QuoteNode, TableCellNode, TableNode, TableRowNode
];

export type ReactiveBlockProps = {
    block: BlockData;
}

export const ReactiveBlock = ({block}: ReactiveBlockProps) => {
    const {namespace, type, editable} = block;

    const initialConfig: InitialConfigType = {
        theme,
        namespace,
        editable,
        nodes: EDITOR_NODES,
        onError: (error) => {
            console.error(error);
        },
    };

    return (
        <div className={`${styles.block} ${styles[type]}`}>
            <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin
                    contentEditable={<ContentEditable className={styles.editable}/>}
                    placeholder={<div className={styles.placeholder}>Enter some text...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <FloatingTextFormatToolbarPlugin/>
                <CheckListPlugin/>
                <ClearEditorPlugin/>
                <CodeSandboxPlugin/>
                <CollapsiblePlugin/>
                <HistoryPlugin/>
                <HorizontalRulePlugin/>
                <LinkPlugin/>
                <ListPlugin/>
                <MarkdownShortcutPlugin transformers={REACTIVE_NOTEBOOK_TRANSFORMERS}/>
                <StreamingPlugin namespace={block.namespace}/>
                <TablePlugin/>
                <TabIndentationPlugin/>
                <ToggleEditablePlugin/>
            </LexicalComposer>
        </div>
    );
}

export default memo(ReactiveBlock, (prevProps, nextProps) => {
    return prevProps.block.namespace === nextProps.block.namespace;
});