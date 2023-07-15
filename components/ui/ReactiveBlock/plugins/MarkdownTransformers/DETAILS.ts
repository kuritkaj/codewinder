import {
    $createCollapsibleContainerNode,
    $isCollapsibleContainerNode,
    CollapsibleContainerNode
} from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin/CollapsibleContainerNode";
import {
    $createCollapsibleContentNode,
    $isCollapsibleContentNode,
    CollapsibleContentNode
} from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin/CollapsibleContentNode";
import {
    $createCollapsibleTitleNode,
    $isCollapsibleTitleNode,
    CollapsibleTitleNode
} from "@/components/ui/ReactiveBlock/plugins/CollapsiblePlugin/CollapsibleTitleNode";
import { ElementTransformer } from '@lexical/markdown';
import { $createTextNode, LexicalNode } from "lexical";

export const DETAILS: ElementTransformer = {
    dependencies: [CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode],
    export: (node: LexicalNode) => {
        if (!$isCollapsibleContainerNode(node)) {
            return null;
        }

        let summary = '';
        let content = '';
        for (const child of node.getChildren()) {
            if ($isCollapsibleTitleNode(child)) {
                summary = child.getTextContent();
            } else if ($isCollapsibleContentNode(child)) {
                content = child.getTextContent();
            }
        }

        return `<details><summary>${summary}</summary>${content}</details>`;
    },
    regExp: /<details><summary>\s*([\s\S]*?)\s*<\/summary>\s*([\s\S]*?)\s*<\/details>/g,
    replace: (parentNode, children, match) => {
        console.log("DETAILS: replace");
        console.log("match: ", match);
        console.log("replaceNode: ", parentNode);
        const [, titleContent, content] = match;
        const collapsibleContainerNode = $createCollapsibleContainerNode(false);  // assuming all details tags start as closed
        const titleNode = $createCollapsibleTitleNode();
        titleNode.append($createTextNode(titleContent.trim()));
        const contentNode = $createCollapsibleContentNode();
        contentNode.append($createTextNode(content.trim()));

        collapsibleContainerNode.append(titleNode, contentNode);
        parentNode.replace(collapsibleContainerNode);
    },
    type: 'element',
} as ElementTransformer;