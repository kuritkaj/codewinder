import { streamIntelligence } from "@/lib/intelligence/streamIntelligence";
import { BlockData, PartialBlockData, PersistableBlockData } from "@/lib/types/BlockData";
import { NotebookData } from "@/lib/types/DatabaseData";
import { MessageType } from "@/lib/types/MessageType";
import { debounce } from "@/lib/util/debounce";
import { generateRandomString } from "@/lib/util/random";
import React, { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";

type SubscribeFunction = (block: BlockData) => void;

type NotebookContextProps = {
    addBlock: (addition: PersistableBlockData, target?: string, before?: boolean) => void;
    appendToBlock: (partial: PartialBlockData) => void;
    blocks: BlockData[];
    generateBlock: (command: string, namespace?: string | null, onClose?: () => void) => Promise<void>;
    getBlock: (target: string) => BlockData | undefined;
    getContents: (until?: string) => string[][];
    moveBlock: (source: string, destination: string) => void;
    notebook: NotebookData;
    removeBlock: (namespace: string) => void;
    replaceBlock: (replacement: BlockData, silent?: boolean) => void;
    resetBlocks: (blocks: BlockData[]) => void;
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
    generateBlock: () => {
        throw new Error('Method not implemented.')
    },
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
    resetBlocks: () => {
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
        debounce((newBlocks: BlockData[], onChange: (newBlocks: BlockData[]) => void) => {
            console.log("Saving blocks...", newBlocks);
            onChange(newBlocks);
        }, 750) as (newBlocks: BlockData[], onChange: (newBlocks: BlockData[]) => void) => void, []);

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

    // This is to support clearing the blocks when the notebook changes.
    useEffect(() => {
        setBlocks(initBlocks || []);
    }, [initBlocks]);

    const addBlock = useCallback((addition: PersistableBlockData, target?: string, before: boolean = false) => {
        if (!addition) return;

        if (!addition?.namespace) addition.namespace = generateRandomString(10);

        setBlocks(prevBlocks => {
            let newBlocks = [...prevBlocks];
            if (target) {
                const index = newBlocks.findIndex(block => block.namespace === target);
                if (index !== -1) {
                    if (before) {
                        newBlocks.splice(index, 0, addition as BlockData); // Insert before the block
                    } else {
                        newBlocks.splice(index + 1, 0, addition as BlockData); // Insert after the block
                    }
                    return newBlocks;
                }
            }

            // If the namespace is not provided or not found, simply append the new block to the end
            newBlocks.push(addition as BlockData);
            return newBlocks;
        });
    }, []);

    const appendToBlock = useCallback((partial: PartialBlockData) => {
        if (!partial || !partial.markdown) return;

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
    }, [blocks]); // This avoids unnecessary re-renders in notebooks and blocks

    const getContents = useCallback((until?: string) => {
        const index = until ? blocks.findIndex(block => block.namespace === until) : -1;
        let subBlocks = index !== -1 ? blocks.slice(0, index) : blocks;
        return subBlocks.map(block => {
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

    const resetBlocks = useCallback((newBlocks: BlockData[] = []) => {
        setBlocks(newBlocks);
    }, []);

    const subscribeToBlock = useCallback((namespace: string, callback: SubscribeFunction) => {
        if (!namespace || !callback) return;

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

    /**
     *  Generates a new block using the provided command to send to an AI.
     *  @param command The command to send to the intelligence.
     *  @param replacement An optional block to replace
     *  @param onClose A callback to invoke when the block is closed.
     */
    const generateBlock = useCallback(async (command: string, replacement: string, onClose = () => {
    }) => {
        if (!replacement) {
            addBlock({
                editable: false,
                markdown: command,
                type: MessageType.UserMessage
            });
        }

        const onError = (partial: PartialBlockData) => {
            replaceBlock({
                editable: false,
                namespace: partial.namespace,
                markdown: partial.markdown,
                type: MessageType.ApiMessage,
            });
        }

        const onMessage = (partial: PartialBlockData) => {
            if (partial.markdown.includes("{clear}")) {
                replaceBlock({
                    editable: false,
                    namespace: partial.namespace,
                    markdown: partial.markdown.split("{clear}").pop() || "",
                    type: MessageType.ApiMessage,
                });
            } else {
                appendToBlock(partial);
            }
        }

        const onOpen = (partial: PartialBlockData) => {
            if (replacement) {
                replaceBlock({...partial, editable: false, type: MessageType.ApiMessage});
            } else {
                addBlock({...partial, editable: false, type: MessageType.ApiMessage});
            }
        }

        const context = getContents(replacement);
        const namespace = replacement || generateRandomString(10);
        await streamIntelligence({
            context,
            objective: command,
            onClose,
            onError: (error) => {
                onError({markdown: error.message, namespace});
            },
            onOpen: () => {
                onOpen({markdown: "", namespace});
            },
            onMessage: (message) => {
                onMessage({markdown: message, namespace});
            }
        });
    }, [addBlock, appendToBlock, getContents, replaceBlock]);

    return (
        <NotebookContext.Provider value={{
            addBlock,
            appendToBlock,
            blocks,
            generateBlock,
            getBlock,
            getContents,
            moveBlock,
            notebook,
            removeBlock,
            replaceBlock,
            resetBlocks,
            subscribeToBlock
        }}>
            {children}
        </NotebookContext.Provider>
    );
}

export default NotebookContext;
