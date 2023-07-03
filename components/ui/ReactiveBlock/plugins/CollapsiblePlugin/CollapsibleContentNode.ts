/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, ElementNode, LexicalNode, SerializedElementNode, } from "lexical";

import styles from "./Collapsible.module.css";

type SerializedCollapsibleContentNode = SerializedElementNode;

export function convertCollapsibleContentElement(): DOMConversionOutput | null {
    const node = $createCollapsibleContentNode();
    return {
        node,
    };
}

export class CollapsibleContentNode extends ElementNode {
    static getType(): string {
        return 'collapsible-content';
    }

    static clone(node: CollapsibleContentNode): CollapsibleContentNode {
        return new CollapsibleContentNode(node.__key);
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-lexical-collapsible-content')) {
                    return null;
                }
                return {
                    conversion: convertCollapsibleContentElement,
                    priority: 2,
                };
            },
        };
    }

    static importJSON(
        serializedNode: SerializedCollapsibleContentNode,
    ): CollapsibleContentNode {
        return $createCollapsibleContentNode();
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement('div');
        dom.classList.add(styles.content);
        return dom;
    }

    updateDOM(prevNode: CollapsibleContentNode, dom: HTMLElement): boolean {
        return false;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.setAttribute('data-lexical-collapsible-content', 'true');
        return {element};
    }

    isShadowRoot(): boolean {
        return true;
    }

    exportJSON(): SerializedCollapsibleContentNode {
        return {
            ...super.exportJSON(),
            type: 'collapsible-content',
            version: 1,
        };
    }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
    return new CollapsibleContentNode();
}

export function $isCollapsibleContentNode(
    node: LexicalNode | null | undefined,
): node is CollapsibleContentNode {
    return node instanceof CollapsibleContentNode;
}
