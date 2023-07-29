import { BlockData, PartialBlockData } from "@/lib/types/BlockData";
import { NotebookData } from "@/lib/types/DatabaseData";
import { debounce } from "@/lib/util/debounce";
import React, { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";

type SubscribeFunction = (block: BlockData) => void;

type NotebookContextProps = {
    addBlock: (addition: BlockData, namespace?: string, before?: boolean) => void;
    appendToBlock: (partial: PartialBlockData) => void;
    blocks: BlockData[];
    getBlock: (namespace: string) => BlockData | undefined;
    getContents: () => string[][];
    moveBlock: (source: string, destination: string) => void;
    notebook: NotebookData;
    removeBlock: (namespace: string) => void;
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
    blocks: [],
    getBlock: () => {
        throw new Error('Method not implemented.')
    },
    getContents: () => {
        throw new Error('Method not implemented.')
    },
    moveBlock: () => {
        throw new Error('Method not implemented.')
    },
    notebook: {} as unknown as NotebookData,
    removeBlock: () => {
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

type NotebookProviderProps = {
    children: ReactNode;
    initBlocks?: BlockData[];
    notebook: NotebookData;
    onChange?: (newBlocks: BlockData[]) => void
}

export function NotebookProvider({children, initBlocks, notebook, onChange}: NotebookProviderProps) {
    const [blocks, setBlocks] = useState<BlockData[]>(initBlocks || []);
    const isFirstRender = useRef(true);
    const subscriptions = useRef<Record<string, SubscribeFunction[]>>({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveBlocks = useCallback(
        debounce((newBlocks, onChange) => {
            onChange(newBlocks);
        }, 1000) as (newBlocks: BlockData[], onChange: (newBlocks: BlockData[]) => void) => void, []);

    // This useEffect hook will be triggered whenever blocks changes.
    useEffect(() => {
        // Skip the first render to avoid saving to the notebook when first viewed.
        // Note to dev: this will save in dev because of double render in strict mode.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (onChange) saveBlocks(blocks, onChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks]);

    const addBlock = useCallback((addition: BlockData, namespace?: string, before: boolean = false) => {
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

    const getBlock = useCallback((namespace: string) => {
        return blocks.find(block => block.namespace === namespace);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // This avoids unnecessary re-renders in notebooks and blocks

    const getContents = useCallback(() => {
        return blocks.map(block => {
            return [block.markdown, block.type];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // This avoids unnecessary re-renders in notebooks and blocks

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

    const removeBlock = useCallback((namespace: string) => {
        setBlocks(prevBlocks => prevBlocks.filter(block => block.namespace !== namespace));
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
            addBlock, appendToBlock, blocks, getBlock, getContents, moveBlock, notebook, removeBlock, replaceBlock, subscribeToBlock
        }}>
            {children}
        </NotebookContext.Provider>
    );
}

export default NotebookContext;
