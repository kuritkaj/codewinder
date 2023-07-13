import { BlockData, PartialBlockData } from "@/lib/types/BlockData";
import { MessageType } from "@/lib/types/MessageType";
import React, { createContext, ReactNode, useCallback, useRef, useState } from "react";

type SubscribeFunction = (block: BlockData) => void;

interface NotebookContextProps {
    addBlock?: (addition: BlockData) => void;
    appendToBlock?: (partial: PartialBlockData) => void;
    getBlock?: (namespace: string) => BlockData | undefined;
    getBlocks?: () => BlockData[];
    getContents?: () => string[][];
    replaceBlock?: (replacement: BlockData, silent?: boolean) => void;
    subscribeToBlock?: (namespace: string, callback: SubscribeFunction) => void;
}

const initialBlocks: BlockData[] = [
    {editable: false, markdown: "Hi there! How can I help?", namespace: "welcome", type: MessageType.ApiMessage}
];

const NotebookContext = createContext<NotebookContextProps>({});

type Props = {
    children: ReactNode;
}

export const NotebookProvider = ({children}: Props) => {
    const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);
    const subscriptions = useRef<Record<string, SubscribeFunction[]>>({});

    const addBlock = useCallback((addition: BlockData) => {
        setBlocks(prevBlocks => [...prevBlocks, addition]);
    }, []);

    const appendToBlock = useCallback((partial: PartialBlockData) => {
        if (!partial.markdown) return;

        setBlocks(prevBlocks => {
            const newBlocks = prevBlocks.map(block =>
                block.namespace === partial.namespace
                    ? {...block, markdown: `${block.markdown}${partial.markdown}`}
                    : block
            );

            // Find the updated block and invoke the callbacks
            const updatedBlock = newBlocks.find(block => block.namespace === partial.namespace);
            if (updatedBlock) {
                subscriptions.current[updatedBlock.namespace]?.forEach(callback => callback(updatedBlock));
            }

            return newBlocks;
        });
    }, []);

    const getBlock = useCallback((namespace: string) => {
        return blocks.find(block => block.namespace === namespace);
    }, [blocks]);

    const getBlocks = useCallback(() => {
        return blocks;
    }, [blocks]);

    const getContents = useCallback(() => {
        return blocks.map(block => {
            return [block.markdown, block.type];
        });
    }, [blocks]);

    const replaceBlock = useCallback((replacement: BlockData, silent = false) => {
        setBlocks(prevBlocks => {
            // Update the block
            const newBlocks = prevBlocks.map(block =>
                block.namespace === replacement.namespace ? replacement : block
            );

            // Check if the new blocks are the same as the old ones
            const areBlocksSame = prevBlocks.every(
                (block, index) => JSON.stringify(block) === JSON.stringify(newBlocks[index])
            );

            // If they are, return the old blocks instead of the new ones
            if (areBlocksSame) return prevBlocks;

            // Invoke subscription callbacks
            if (!silent) subscriptions.current[replacement.namespace]?.forEach(callback => callback(replacement));

            return newBlocks;
        });
    }, []);

    const subscribeToBlock = useCallback((namespace: string, callback: SubscribeFunction) => {
        subscriptions.current = {
            ...subscriptions.current,
            [namespace]: [...(subscriptions.current[namespace] || []), callback]
        };

        return () => {
            // Remove the callback from the list of subscriptions for the given namespace.
            subscriptions.current = {
                ...subscriptions.current,
                [namespace]: (subscriptions.current[namespace] || []).filter(cb => cb !== callback)
            };
        };
    }, []);

    return (
        <NotebookContext.Provider value={{addBlock, appendToBlock, getBlock, getBlocks, getContents, replaceBlock, subscribeToBlock}}>
            {children}
        </NotebookContext.Provider>
    );
};

export default NotebookContext;
