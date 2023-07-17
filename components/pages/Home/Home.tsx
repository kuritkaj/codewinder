"use client";

import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import { UserContextProvider } from "@/components/context/UserContext";
import Header from "@/components/ui/Header/Header";
import InputPanel from "@/components/ui/InputPanel";
import SettingsPanel from "@/components/ui/SettingsPanel";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import NotebookPanel from "components/ui/NotebookPanel";
import React from "react";
import styles from "./Home.module.css";

const Home = () => {
    const supabase = createClientComponentClient();

    return (
        <UserContextProvider supabase={supabase}>
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
        </UserContextProvider>
    );
}

export default Home;