"use client";

import { UserContextProvider } from "@/components/context/UserContext";
import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Header from "@/components/ui/Header";
import { Database } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import React from "react";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type NotesProps = {
    notebooks?: NotebookData[] | null;
    session?: Session | null;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const Stack = ({notebooks, session, stack, stacks}: NotesProps) => {
    const supabase = createClientComponentClient();

    return (
        <UserContextProvider session={session} supabase={supabase}>
            <div className={styles.fullscreen}>
                <Header user={session?.user}/>
                <main className={styles.main}>
                    {stack && <StackPanel stack={stack} stacks={stacks}/>}
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