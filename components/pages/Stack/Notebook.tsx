"use client";

import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import { BlockData } from "@/lib/types/BlockData";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import InputPanel from "components/panels/InputPanel";
import SettingsPanel from "components/panels/SettingsPanel";
import { Database, Json } from "@/lib/types/Database";
import NotebookPanel from "components/panels/NotebookPanel";
import React from "react";
import styles from "./Notebook.module.css";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];

type NoteProps = {
    notebook: NotebookData;
    onDelete: (notebook: NotebookData) => void;
}

const Notebook = ({notebook, onDelete}: NoteProps) => {
    const blocks = notebook.blocks as unknown as BlockData[];
    const supabase = createClientComponentClient<Database>();

    const handleDelete = async () => {
        onDelete(notebook);
    }

    const handleSave = async (blocks: BlockData[]) => {
        const json = JSON.stringify(blocks);
        await supabase.from("notebooks").update({blocks: json}).eq("id", notebook.id);
    }

    return (
        <SettingsProvider>
            <div className={styles.panels}>
                <SettingsPanel onDelete={handleDelete}/>
                <NotebookProvider init={blocks} onChange={handleSave}>
                    <NotebookPanel/>
                    <InputPanel/>
                </NotebookProvider>
            </div>
        </SettingsProvider>
    );
}

export default Notebook;