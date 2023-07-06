import { MessageType } from "@/lib/types/MessageType";
import { createContext, useState } from "react";

export type BlockData = {
    editable?: boolean;
    markdown: string;
    namespace: string;
    type: MessageType;
}

export type PartialBlockData = {
    markdown: string;
    namespace: string;
}

interface NotebookContextProps {
    blocks: BlockData[];
    addBlock?: (addition: BlockData) => void;
    appendToBlock?: (partial: PartialBlockData) => void;
    replaceBlock?: (replacement: BlockData) => void;
}

const initialBlocks: BlockData[] = [
    {editable: false, markdown: "Hi there! How can I help?", namespace: "welcome", type: MessageType.ApiMessage}
];

const NotebookContext = createContext<NotebookContextProps>({
    blocks: initialBlocks
});

export const NotebookProvider = ({ children }) => {
    const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);

    const addBlock = (addition: BlockData) => {
        setBlocks(prevBlocks => [...prevBlocks, addition]);
    };

    const appendToBlock = (partial: PartialBlockData) => {
        setBlocks(prevBlocks => prevBlocks.map(block =>
            block.namespace === partial.namespace
                ? { ...block, markdown: `${block.markdown}${partial.markdown}` }
                : block
        ));
    }

    const replaceBlock = (replacement: BlockData) => {
        console.log("replacing block", replacement);
        setBlocks(prevBlocks => prevBlocks.map(block =>
            block.namespace === replacement.namespace ? replacement : block
        ));
    };

    return (
        <NotebookContext.Provider value={{ blocks, addBlock, appendToBlock, replaceBlock }}>
            {children}
        </NotebookContext.Provider>
    );
};

export default NotebookContext;
