import useNotebook from "@/components/context/useNotebook";
import ReactiveBlock from "@/components/ui/ReactiveBlock";
import { BlockData } from "@/lib/types/BlockData";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React, { useEffect, useRef, useState } from "react";
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

const ReactiveNotebook = () => {
    const scrollableRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);

    const {addBlock, blocks, moveBlock, notebook, removeBlock, resetBlocks} = useNotebook();
    const [clonedBlocks, setClonedBlocks] = useState<BlockData[]>([...blocks]);

    const handleDragCancel = () => {
        resetBlocks(clonedBlocks);
    }

    const handleDragEnd = (event) => {
        const {active, over} = event;
        console.log("Drag end", event);

        if (!active || !over || active.id === over.id) return;

        const isActiveNotebook = clonedBlocks.findIndex(block => block.namespace === active.id) !== -1;
        const isOverNotebook = clonedBlocks.findIndex(block => block.namespace === over.id) !== -1;

        if (isActiveNotebook && isOverNotebook) {
            console.log("Moving block", active.id, "to", over.id);
            moveBlock(active.id, over.id);
        }
        // if (isActiveNotebook && !isOverNotebook) {
        //     console.log("Removing block", active.id);
        //     removeBlock(active.id);
        // }
        // if (!isActiveNotebook && isOverNotebook) {
        //     console.log("Adding block", active.id, "to", over.id);
        //     addBlock(active.data.current.block, over.id);
        // }
    }

    const handleOnDragOver = (event) => {
        const {active, over} = event;
        console.log("Drag over", event);

        if (!active || !over || active.id === over.id) return;

        const isActiveNotebook = active.data.current.notebook.id === notebook.id;
        const isOverNotebook = over.data.current.notebook.id === notebook.id;

        if (isActiveNotebook && !isOverNotebook) {
            console.log("Drag removing block", active.id);
            removeBlock(active.id);
        }
        if (!isActiveNotebook && isOverNotebook) {
            console.log("Drag adding block", active.id, "to", over.id);
            addBlock(active.data.current.block(active.id), over.id);
        }
    }

    const handleDragStart = () => {
        setClonedBlocks([...blocks]);
    }

    useDndMonitor({
        onDragCancel: handleDragCancel,
        onDragEnd: handleDragEnd,
        onDragOver: handleOnDragOver,
        onDragStart: handleDragStart,
    });

    const {setNodeRef} = useDroppable({
        id: notebook.id,
        data: {notebook},
    });

    useEffect(() => {
        const notebook = scrollableRef.current;
        if (notebook) {
            const handleScroll = () => {
                const atBottom = notebook.scrollTop + notebook.offsetHeight >= notebook.scrollHeight - 150; // from bottom
                hasUserScrolledUp.current = !atBottom;
            };
            notebook.addEventListener("scroll", handleScroll);
            return () => {
                notebook.removeEventListener("scroll", handleScroll);
            };
        }
    }, []);

    if (!hasUserScrolledUp.current) {
        const scrollable = scrollableRef.current;
        if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
    }

    return (
        <SortableContext
            id={notebook.id}
            items={clonedBlocks.map(block => block.namespace)}
            strategy={verticalListSortingStrategy}
        >
            <div ref={setNodeRef} className={styles.dropzone}>
                <div ref={scrollableRef} className={styles.notebook}>
                    {blocks.length > 0 ? (
                        blocks.map((block) => {
                            return <ReactiveBlock
                                key={block.namespace}
                                block={block}
                                notebook={notebook}
                            />;
                        })
                    ) : (
                        <div className={styles.placeholder}>{getGreeting()}</div>
                    )}
                </div>
            </div>
        </SortableContext>
    );
}

export default ReactiveNotebook;