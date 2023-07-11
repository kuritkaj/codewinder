import useNotebook from "@/components/context/useNotebook";
import dynamic from "next/dynamic";
import React, { useEffect, useRef } from "react";
import styles from "./ReactiveNotebook.module.css";

const ReactiveBlock = dynamic(() => import('@/components/ui/ReactiveBlock'), {
    ssr: false
})

const ReactiveNotebook = () => {
    const notebookRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);

    const {getBlocks} = useNotebook();

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
        if (notebook) {
            notebook.scrollTop = notebook.scrollHeight;
        }
    }

    return (
        <div ref={notebookRef} className={styles.notebook}>
            {
                getBlocks().map((block) => {
                    return <ReactiveBlock
                        key={block.namespace}
                        block={block}
                    />;
                })
            }
        </div>
    );
}

export default ReactiveNotebook;