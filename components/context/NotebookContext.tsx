import { BlockData, PartialBlockData } from "@/lib/types/BlockData";
import { MessageType } from "@/lib/types/MessageType";
import React, { createContext, ReactNode, useCallback, useRef, useState } from "react";

type SubscribeFunction = (block: BlockData) => void;

interface NotebookContextProps {
    addBlock: (addition: BlockData, namespace?: string, before?: boolean) => void;
    appendToBlock: (partial: PartialBlockData) => void;
    deleteBlock: (namespace: string) => void;
    getBlock: (namespace: string) => BlockData | undefined;
    getBlocks: () => BlockData[];
    getContents: () => string[][];
    moveBlock: (source: string, destination: string) => void;
    replaceBlock: (replacement: BlockData, silent?: boolean) => void;
    subscribeToBlock: (namespace: string, callback: SubscribeFunction) => void;
}

const defaultImplementation = {
    addBlock: () => {
        throw new Error('Method not implemented.')
    },
    appendToBlock: () => {
        throw new Error('Method not implemented.')
    },
    deleteBlock: () => {
        throw new Error('Method not implemented.')
    },
    getBlock: () => {
        throw new Error('Method not implemented.')
    },
    getBlocks: () => {
        throw new Error('Method not implemented.')
    },
    getContents: () => {
        throw new Error('Method not implemented.')
    },
    moveBlock: () => {
        throw new Error('Method not implemented.')
    },
    replaceBlock: () => {
        throw new Error('Method not implemented.')
    },
    subscribeToBlock: () => {
        throw new Error('Method not implemented.')
    },
};

const NotebookContext = createContext<NotebookContextProps>(defaultImplementation);

const initialBlocks: BlockData[] = [
    {editable: false, markdown: "Hi there! How can I help?", namespace: Math.random().toString(), type: MessageType.ApiMessage}
];

type Props = {
    children: ReactNode;
}

export function NotebookProvider({children}: Props) {
    const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);
    const subscriptions = useRef<Record<string, SubscribeFunction[]>>({});

    const addBlock = useCallback(
        (addition: BlockData, namespace?: string, before: boolean = false) => {
            setBlocks(prevBlocks => {
                let newBlocks = [...prevBlocks];
                if (namespace) {
                    const index = newBlocks.findIndex(block => block.namespace === namespace);
                    if (index !== -1) {
                        if (before) {
                            newBlocks.splice(index, 0, addition); // Insert before the block
                        } else {
                            newBlocks.splice(index + 1, 0, addition); // Insert after the block
                        }
                        return newBlocks;
                    }
                }

                // If the namespace is not provided or not found, simply append the new block to the end
                newBlocks.push(addition);
                return newBlocks;
            });
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

    const deleteBlock = useCallback((namespace: string) => {
        setBlocks(prevBlocks => prevBlocks.filter(block => block.namespace !== namespace));
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

    const moveBlock = useCallback((source: string, destination: string) => {
        setBlocks(prevBlocks => {
            const fromIndex = prevBlocks.findIndex(block => block.namespace === source);
            const toIndex = prevBlocks.findIndex(block => block.namespace === destination);

            if (fromIndex === -1 || toIndex === -1) return prevBlocks;

            const newBlocks = [...prevBlocks];
            newBlocks.splice(toIndex, 0, newBlocks.splice(fromIndex, 1)[0]);

            return newBlocks;
        });
    }, []);

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
        <NotebookContext.Provider value={{
            addBlock, appendToBlock, deleteBlock, getBlock, getBlocks, getContents, moveBlock, replaceBlock, subscribeToBlock
        }}>
            {children}
        </NotebookContext.Provider>
    );
}

export default NotebookContext;
