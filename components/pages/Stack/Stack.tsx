"use client";

import { UserContextProvider } from "@/components/context/UserContext";
import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import Header from "@/components/ui/Header";
import { Database } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React from "react";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type NotesProps = {
    notebooks?: NotebookData[] | null;
    stack?: StackData | null;
}

const Stack = ({notebooks, stack}: NotesProps) => {
    const supabase = createClientComponentClient();

    return (
        <UserContextProvider supabase={supabase}>
            <div className={styles.fullscreen}>
                <Header/>
                <main className={styles.main}>
                    {stack && <Stack stack={stack}/>}
                    {notebooks && notebooks.length > 0 ?
                        notebooks.map((notebook) => (
                            <div key={notebook.id}>
                                <Notebook/>
                            </div>)
                        ) :
                        <Notebook/>
                    }
                </main>
            </div>
        </UserContextProvider>
    );
}

export default Stack;