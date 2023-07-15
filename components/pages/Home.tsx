"use client";

import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import Header from "@/components/ui/Header/Header";
import InputPanel from "@/components/ui/InputPanel";
import SettingsPanel from "@/components/ui/SettingsPanel";
import NotebookPanel from "components/ui/NotebookPanel";
import React from "react";
import styles from "./Home.module.css";

const Home = () => {
    return (
        <div className={styles.fullscreen}>
            <Header/>
            <main className={styles.main}>
                <SettingsProvider>
                    <div className={styles.panels}>
                        <SettingsPanel/>
                        <NotebookProvider>
                            <NotebookPanel/>
                            <InputPanel/>
                        </NotebookProvider>
                    </div>
                </SettingsProvider>
            </main>
        </div>
    );
}

export default Home;