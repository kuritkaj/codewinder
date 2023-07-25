import useNotebook from "@/components/context/useNotebook";
import ReactiveBlock from "@/components/ui/ReactiveBlock";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext } from "@dnd-kit/sortable";
import React, { useEffect, useRef } from "react";
import styles from "./ReactiveNotebook.module.css";

function getGreeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
        return "Good morning! How can I help?";
    } else if (currentHour < 18) {
        return "Good afternoon! What would you like to do?";
    } else {
        return "Good evening! Is there anything I can help you with?";
    }
}

// const ReactiveBlock = dynamic(() => import("@/components/ui/ReactiveBlock"), {
//     ssr: false
// });

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
            {getBlocks().length > 0 ? (
                <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                    <SortableContext items={getBlocks().map(block => block.namespace)}>
                        {getBlocks().map((block) => {
                            return <ReactiveBlock
                                key={block.namespace}
                                block={block}
                            />;
                        })}
                    </SortableContext>
                </DndContext>
            ) : (
                <div className={styles.placeholder}>{getGreeting()}</div>
            )}
        </div>
    );
}

export default ReactiveNotebook;