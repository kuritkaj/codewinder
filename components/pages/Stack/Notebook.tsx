"use client";

import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import { BlockData } from "@/lib/types/BlockData";
import { Database } from "@/lib/types/Database";
import InputPanel from "components/panels/InputPanel";
import NotebookPanel from "components/panels/NotebookPanel";
import SettingsPanel from "components/panels/SettingsPanel";
import React from "react";
import styles from "./Notebook.module.css";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type NotebookProps = {
    stack?: StackData | null;
    notebook: NotebookData;
    onDelete?: (notebook: NotebookData) => void;
    onSave?: (notebook: NotebookData, blocks: BlockData[]) => void;
}

const Notebook = ({notebook, onDelete, onSave, stack}: NotebookProps) => {
    const blocks = notebook.blocks as unknown as BlockData[];

    const handleDelete = () => {
        if (onDelete) onDelete(notebook);
    }

    const handleSave = (blocks: BlockData[]) => {
        if (onSave) onSave(notebook, blocks);
    }

    return (notebook ? (
        <SettingsProvider>
            <div className={styles.panels}>
                <SettingsPanel onDelete={handleDelete}/>
                <NotebookProvider init={blocks} onChange={handleSave}>
                    <NotebookPanel/>
                    <InputPanel defaultInput={
                        !blocks || blocks.length === 0 ? stack?.name || "" : ""
                    }/>
                </NotebookProvider>
            </div>
        </SettingsProvider>
    ) : "No notebook provided");
}

export default Notebook;