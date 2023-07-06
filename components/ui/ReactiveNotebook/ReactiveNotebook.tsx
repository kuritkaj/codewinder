import { BlockData, PartialBlockData } from "@/components/context/NotebookContext";
import useNotebook from "@/components/context/useNotebook";
import dynamic from "next/dynamic";
import React, { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useRef } from "react";
import styles from "./ReactiveNotebook.module.css";

const ReactiveBlock = dynamic(() => import('@/components/ui/ReactiveBlock'), {
    ssr: false
})

export interface EditableNotebook {
    addBlock: (block: BlockData) => void;
    appendToBlock: (partial: PartialBlockData) => void;
    getContents: () => [markdown: string, type: string][];
    replaceBlock: (block: BlockData) => void;
}

const ReactiveNotebook: ForwardRefRenderFunction<EditableNotebook> = (props, forwardedRef) => {
    const notebookRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);

    const {blocks, addBlock, appendToBlock, replaceBlock} = useNotebook();

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

    useImperativeHandle(forwardedRef, () => ({
        addBlock(block: BlockData) {
            addBlock(block);
        },

        appendToBlock(partial: PartialBlockData) {
            appendToBlock(partial);
        },

        getContents() {
            return blocks.map(block => {
                return [block.markdown, block.type];
            });
        },

        replaceBlock(replacement: BlockData) {
            replaceBlock(replacement);
        }
    }));

    return (
        <div ref={notebookRef} className={styles.notebook}>
            {
                blocks.map((block) => {
                    return <ReactiveBlock
                        key={block.namespace}
                        editable={block.editable}
                        markdown={block.markdown}
                        namespace={block.namespace}
                        onChange={replaceBlock}
                        type={block.type}
                    />;
                })
            }
        </div>
    );
}

export default forwardRef(ReactiveNotebook);