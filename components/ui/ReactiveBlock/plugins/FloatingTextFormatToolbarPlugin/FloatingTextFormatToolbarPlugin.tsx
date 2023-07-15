/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeHighlightNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { CodeIcon, FontBoldIcon, FontItalicIcon, StrikethroughIcon, UnderlineIcon } from "@radix-ui/react-icons";
import * as Toolbar from "@radix-ui/react-toolbar";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    FORMAT_TEXT_COMMAND,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Portal from '@radix-ui/react-portal';

import { getDomRangeRect } from "../../utils/getDomRangeRect";
import { getSelectedNode } from "../../utils/getSelectedNode";
import { setFloatingElemPosition } from "../../utils/setFloatingElemPosition";
import styles from "./FloatingTextFormatToolbarPlugin.module.css";

function TextFormatFloatingToolbar({
    editor,
    anchorElem,
    // isLink,
    isBold,
    isItalic,
    isUnderline,
    isCode,
    isStrikethrough,
}: {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
    isBold: boolean;
    isCode: boolean;
    isItalic: boolean;
    isLink: boolean;
    isStrikethrough: boolean;
    isUnderline: boolean;
}): React.JSX.Element {
    const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
    const [locked, setLocked] = useState<boolean>(false);

    useEffect(() => {
        setLocked(!editor.isEditable());
        return editor.registerEditableListener((editable) => {
            setLocked(!editable);
        });
    }, [editor]);

    // const insertLink = useCallback(() => {
    //     if (!isLink) {
    //         editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    //     } else {
    //         editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    //     }
    // }, [editor, isLink]);

    function mouseMoveListener(e: MouseEvent) {
        if (
            popupCharStylesEditorRef?.current &&
            (e.buttons === 1 || e.buttons === 3)
        ) {
            if (popupCharStylesEditorRef.current.style.pointerEvents !== "none") {
                const x = e.clientX;
                const y = e.clientY;
                const elementUnderMouse = document.elementFromPoint(x, y);

                if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
                    // Mouse is not over the target element => not a normal click, but probably a drag
                    popupCharStylesEditorRef.current.style.pointerEvents = "none";
                }
            }
        }
    }

    function mouseUpListener() {
        if (popupCharStylesEditorRef?.current) {
            if (popupCharStylesEditorRef.current.style.pointerEvents !== "auto") {
                popupCharStylesEditorRef.current.style.pointerEvents = "auto";
            }
        }
    }

    useEffect(() => {
        if (popupCharStylesEditorRef?.current) {
            document.addEventListener("mousemove", mouseMoveListener);
            document.addEventListener("mouseup", mouseUpListener);

            return () => {
                document.removeEventListener("mousemove", mouseMoveListener);
                document.removeEventListener("mouseup", mouseUpListener);
            };
        }
    }, [popupCharStylesEditorRef]);

    const updateTextFormatFloatingToolbar = useCallback(() => {
        const selection = $getSelection();

        const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
        const nativeSelection = window.getSelection();

        if (popupCharStylesEditorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection !== null &&
            nativeSelection !== null &&
            !nativeSelection.isCollapsed &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const rangeRect = getDomRangeRect(nativeSelection, rootElement);

            setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
        }
    }, [editor, anchorElem]);

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
                updateTextFormatFloatingToolbar();
            });
        };

        window.addEventListener("resize", update);
        if (scrollerElem) {
            scrollerElem.addEventListener("scroll", update);
        }

        return () => {
            window.removeEventListener("resize", update);
            if (scrollerElem) {
                scrollerElem.removeEventListener("scroll", update);
            }
        };
    }, [editor, updateTextFormatFloatingToolbar, anchorElem]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateTextFormatFloatingToolbar();
        });
        return mergeRegister(
            editor.registerUpdateListener(({editorState}) => {
                editorState.read(() => {
                    updateTextFormatFloatingToolbar();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateTextFormatFloatingToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, updateTextFormatFloatingToolbar]);

    return (
        <div ref={popupCharStylesEditorRef} className={styles.popup}>
            {!locked && (
                <Toolbar.Root className={styles.toolbar} aria-label="Formatting options">
                    <Toolbar.ToggleGroup
                        type="multiple"
                        aria-label="Text formatting"
                        defaultValue={[
                            isBold ? "bold" : "",
                            isItalic ? "italic" : "",
                            isUnderline ? "underline" : "",
                            isStrikethrough ? "strikethrough" : "",
                            isCode ? "code" : "",
                        ]}
                    >
                        <Toolbar.ToggleItem className={styles.toggleitem} value="bold" aria-label="Bold"
                                            onClick={() => {
                                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                                            }}>
                            <FontBoldIcon/>
                        </Toolbar.ToggleItem>
                        <Toolbar.ToggleItem className={styles.toggleitem} value="italic" aria-label="Italic"
                                            onClick={() => {
                                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                                            }}>
                            <FontItalicIcon/>
                        </Toolbar.ToggleItem>
                        <Toolbar.ToggleItem className={styles.toggleitem} value="underline" aria-label="Strike through"
                                            onClick={() => {
                                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                                            }}>
                            <UnderlineIcon/>
                        </Toolbar.ToggleItem>
                        <Toolbar.ToggleItem className={styles.toggleitem} value="strikethrough" aria-label="Strike through"
                                            onClick={() => {
                                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                                            }}>
                            <StrikethroughIcon/>
                        </Toolbar.ToggleItem>
                        <Toolbar.ToggleItem className={styles.toggleitem} value="code" aria-label="Strike through"
                                            onClick={() => {
                                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
                                            }}>
                            <CodeIcon/>
                        </Toolbar.ToggleItem>
                    </Toolbar.ToggleGroup>
                </Toolbar.Root>
            )}
        </div>
    );
}

function useFloatingTextFormatToolbar(
    editor: LexicalEditor,
    anchorElem: HTMLElement,
): React.JSX.Element | null {
    const [isText, setIsText] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);

    const updatePopup = useCallback(() => {
        editor.getEditorState().read(() => {
            // Should not pop up the floating toolbar when using IME input
            // Nor when not editable
            if (editor.isComposing() || !editor.isEditable()) {
                return;
            }
            const selection = $getSelection();
            const nativeSelection = window.getSelection();
            const rootElement = editor.getRootElement();

            if (
                nativeSelection !== null &&
                (!$isRangeSelection(selection) ||
                    rootElement === null ||
                    !rootElement.contains(nativeSelection.anchorNode))
            ) {
                setIsText(false);
                return;
            }

            if (!$isRangeSelection(selection)) {
                return;
            }

            const node = getSelectedNode(selection);

            // Update text format
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsUnderline(selection.hasFormat("underline"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
            setIsCode(selection.hasFormat("code"));

            // Update links
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }

            if (
                !$isCodeHighlightNode(selection.anchor.getNode()) &&
                selection.getTextContent() !== ""
            ) {
                setIsText($isTextNode(node));
            } else {
                setIsText(false);
            }

            const rawTextContent = selection.getTextContent().replace(/\n/g, "");
            if (!selection.isCollapsed() && rawTextContent === "") {
                setIsText(false);
                return;
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updatePopup);
        return () => {
            document.removeEventListener("selectionchange", updatePopup);
        };
    }, [updatePopup]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(() => {
                updatePopup();
            }),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setIsText(false);
                }
            }),
        );
    }, [editor, updatePopup]);

    if (!isText || isLink) {
        return null;
    }

    return (
        <Portal.Root container={anchorElem}>
            <TextFormatFloatingToolbar
                editor={editor}
                anchorElem={anchorElem}
                isLink={isLink}
                isBold={isBold}
                isItalic={isItalic}
                isStrikethrough={isStrikethrough}
                isUnderline={isUnderline}
                isCode={isCode}
            />
        </Portal.Root>
    );
}

export default function FloatingTextFormatToolbarPlugin({anchorElem}: { anchorElem?: HTMLElement| null; }): React.JSX.Element | null {
    const [editor] = useLexicalComposerContext();
    return useFloatingTextFormatToolbar(editor, anchorElem || globalThis?.document?.body);
}