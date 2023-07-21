"use client";

import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import InputPanel from "components/panels/InputPanel";
import SettingsPanel from "components/panels/SettingsPanel";
import { Database } from "@/lib/types/Database";
import NotebookPanel from "components/panels/NotebookPanel";
import React from "react";
import styles from "./Notebook.module.css";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];

type NoteProps = {
    notebook?: NotebookData | null;
}

const Notebook = ({notebook}: NoteProps) => {
    return (
        <SettingsProvider>
            <div className={styles.panels}>
                <SettingsPanel/>
                <NotebookProvider>
                    <NotebookPanel/>
                    <InputPanel/>
                </NotebookProvider>
            </div>
        </SettingsProvider>
    );
}

export default Notebook;