import useNotebook from "@/components/context/useNotebook";
import ReactiveBlock from "@/components/ui/ReactiveBlock";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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

const ReactiveNotebook = () => {
    const scrollableRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);

    const {addBlock, blocks, moveBlock, notebook, removeBlock} = useNotebook();
    const [clonedBlocks, setClonedBlocks] = React.useState(blocks);

    useEffect(() => {
        setClonedBlocks(blocks);
    }, [blocks]);

    const handleDragEnd = (event) => {
        const {active, over} = event;

        // Active and over are both defined
        if (active && over && active.id !== over.id) {
            if (active.data.current.notebook.id === notebook.id) {
                if (over.data.current.notebook.id === notebook.id) {
                    // If the active and over block are both from this notebook, then move the block
                    console.log("Moving block", active.id, "to", over.id);
                    moveBlock(active.id, over.id);
                } else {
                    // Otherwise, the active block is from this notebook and the over block is from another notebook
                    console.log("Removing block", active.id);
                    removeBlock(active.id);
                }
            } else if (over.data.current.notebook.id === notebook.id) {
                // The active block is from another notebook, moving to this one
                console.log("Adding block", active.id, "to", over.id);
                addBlock(active.data.current.block()); // See useDroppable in ReactiveBlock
            }
        }
    }

    const handleOnDragOver = (event) => {
        const {active, over} = event;

        // Active and over are both defined
        if (active && over && active.id !== over.id) {
            if (active.data.current.notebook.id === notebook.id) {
                if (over.data.current.notebook.id === notebook.id) {
                    // If the active and over block are both from this notebook, then do nothing.
                } else {
                    // Otherwise, the active block is from this notebook and the over block is from another notebook
                    console.log("Temp removing block", active.id);
                    clonedBlocks.splice(clonedBlocks.findIndex(block => block.namespace === active.id), 1);
                }
            } else if (over.data.current.notebook.id === notebook.id) {
                // The active block is from another notebook, moving to this one
                console.log("Temp adding block", active.id, "to", over.id);
                clonedBlocks.push(active.data.current.block());
            }
        }
    }

    useDndMonitor({
        onDragEnd: handleDragEnd,
        onDragOver: handleOnDragOver,
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
            notebook.addEventListener('scroll', handleScroll);
            return () => {
                notebook.removeEventListener('scroll', handleScroll);
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