import useNotebook from "@/components/context/useNotebook";
import ReactiveBlock from "@/components/ui/ReactiveBlock";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import React, { useEffect, useRef } from "react";
import styles from "./ReactiveNotebook.module.css";

const ReactiveNotebook = () => {
    const notebookRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);

    const {getBlocks, moveBlock} = useNotebook();

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

    if (!hasUserScrolledUp.current) {
        const notebook = notebookRef.current;
        if (notebook) notebook.scrollTop = notebook.scrollHeight;
    }

    function handleDragEnd(event) {
        const {active, over} = event;
        if (active && over) moveBlock(active.id, over.id);
    }

    return (
        <div ref={notebookRef} className={styles.notebook}>
            <DndContext onDragEnd={handleDragEnd}>
                <SortableContext items={getBlocks().map(block => block.namespace)}>
                    {getBlocks().map((block) => {
                        return <ReactiveBlock
                            key={block.namespace}
                            block={block}
                            anchorRef={notebookRef}
                        />;
                    })}
                </SortableContext>
            </DndContext>
        </div>
    );
}

export default ReactiveNotebook;