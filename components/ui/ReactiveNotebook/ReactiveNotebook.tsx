import { ReactiveBlockType } from "@/components/ui/ReactiveBlock/ReactiveBlock";
import dynamic from "next/dynamic";
import React, { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useRef, useState } from "react";
import styles from "./ReactiveNotebook.module.css";

const ReactiveBlock = dynamic(() => import('@/components/ui/ReactiveBlock'), {
    ssr: false,
})

export interface EditableNotebook {
    addBlock: (block: BlockData) => void;
    appendToBlock: (partial: PartialBlockData) => void;
    replaceBlock: (block: BlockData) => void;
}

export type BlockData = {
    editable?: boolean;
    markdown: string;
    namespace: string;
    type: ReactiveBlockType;
}

export type PartialBlockData = {
    markdown: string;
    namespace: string;
}

const ReactiveNotebook: ForwardRefRenderFunction<EditableNotebook> = (props, ref) => {
    const notebookRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);

    const [blocks, setBlocks] = useState<BlockData[]>([
        {editable: false, markdown: "Hi there! How can I help?", namespace: "welcome", type: "apimessage"}
    ]);

    useEffect(() => {
        const notebook = notebookRef.current;
        if (notebook) {
            const handleScroll = () => {
                const atBottom = notebook.scrollTop + notebook.offsetHeight >= notebook.scrollHeight - 150; // from bottom
                hasUserScrolledUp.current = !atBottom;
            };
            notebook.addEventListener('scroll', handleScroll);
            return () => {
                notebook.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    useEffect(() => {
        if (!hasUserScrolledUp.current) {
            const notebook = notebookRef.current;
            if (notebook) {
                notebook.scrollTop = notebook.scrollHeight;
            }
        }
    }, [blocks]);

    useImperativeHandle(ref, () => ({
        addBlock(block: BlockData) {
            setBlocks(prevBlocks => {
                return [...prevBlocks, block];
            });
        },

        appendToBlock(partial: PartialBlockData) {
            setBlocks(prevBlocks => {
                return prevBlocks.map(block => {
                    if (block.namespace === partial.namespace) {
                        return {
                            ...block,
                            markdown: `${block.markdown}${partial.markdown}`,
                        };
                    }
                    return block;
                });
            });
        },

        replaceBlock(replacement: BlockData) {
            setBlocks(prevBlocks => {
                return prevBlocks.map(block => {
                    if (block.namespace === replacement.namespace) {
                        return {
                            ...replacement
                        };
                    }
                    return block;
                });
            });
        }
    }));

    return (
        <div ref={notebookRef} className={styles.notebook}>
            {
                blocks.map((block) => {
                    return <ReactiveBlock key={block.namespace}
                                          editable={block.editable}
                                          markdown={block.markdown}
                                          namespace={block.namespace}
                                          type={block.type}
                    />;
                })
            }
        </div>
    );
}

export default forwardRef(ReactiveNotebook);