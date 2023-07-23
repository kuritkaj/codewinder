"use client";

import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import { BlockData } from "@/lib/types/BlockData";
import { Database, Json } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
}

const Notebook = ({notebook, onDelete, stack}: NotebookProps) => {
    const blocks = notebook.blocks as unknown as BlockData[];
    const supabase = createClientComponentClient<Database>();

    const handleDelete = async () => {
        if (onDelete) onDelete(notebook);
    }

    const handleSave = async (blocks: BlockData[]) => {
        const json = blocks as unknown as Json[];
        await supabase.from("notebooks").update({blocks: json}).eq("id", notebook.id);
    }

    return (notebook ? (
        <SettingsProvider>
            <div className={styles.panels}>
                <SettingsPanel onDelete={handleDelete}/>
                <NotebookProvider init={blocks} onChange={handleSave}>
                    <NotebookPanel/>
                    <InputPanel defaultInput={
                        !blocks || blocks.length == 0 ? stack?.name : ""
                    }/>
                </NotebookProvider>
            </div>
        </SettingsProvider>
    ) : "No notebook provided");
}

export default Notebook;