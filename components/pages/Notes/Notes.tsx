"use client";

import { UserContextProvider } from "@/components/context/UserContext";
import styles from "@/components/pages/Home/Home.module.css";
import Header from "@/components/ui/Header";
import { Database } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React from "react";

type Note = Database["public"]["tables"]["notes"]["row"];

type NotesProps = {
    notes: Note[];
}

const Notes = ({notes}: NotesProps) => {
    const supabase = createClientComponentClient();

    return (
        <UserContextProvider supabase={supabase}>
            <div className={styles.fullscreen}>
                <Header/>
                <main className={styles.main}>
                    {notes.length > 0 ? notes.map((note) => (
                    <div key={note.id}>
                        <h2>{note.name}</h2>
                        <p>{note.content}</p>
                    </div>)) : "No notes"}
                </main>
            </div>
        </UserContextProvider>
    );
}

export default Notes;