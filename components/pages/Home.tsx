import { NotebookProvider } from "@/components/context/NotebookContext";
import { SettingsProvider } from "@/components/context/SettingsContext";
import Header from "@/components/ui/Header/Header";
import InputPanel from "@/components/ui/InputPanel";
import SettingsPanel from "@/components/ui/SettingsPanel";
import NotebookPanel from "components/ui/NotebookPanel";
import Head from "next/head";
import React from "react";
import styles from "./Home.module.css";

const Home = () => {
    return (
        <>
            <Head>
                <title>Codewinder</title>
                <meta name="description" content="Your intelligent personal assistant"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
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
        </>
    );
}

export default Home;