"use client";

import { UserContextProvider } from "@/components/context/UserContext";
import styles from "@/components/pages/Stacks/Stacks.module.css";
import Header from "@/components/ui/Header";
import Search from "@/components/ui/Search/Search";
import StacksPanel from "@/components/ui/StacksPanel";

import { Database } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React from "react";

type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type StacksProps = {
    stacks?: StackData[] | null;
}

const Stack = ({stacks}: StacksProps) => {
    const supabase = createClientComponentClient();
    const router = useRouter()

    const onSearch = async (userInput: string) => {
        router.push(`/stacks/new`);
    }

    return (
        <UserContextProvider supabase={supabase}>
            <div className={styles.fullscreen}>
                <Header/>
                <div className={styles.search}>
                    <Search handleSubmit={onSearch}/>
                </div>
                <main className={styles.stacks}>
                    <StacksPanel stacks={stacks}/>
                </main>
            </div>
        </UserContextProvider>
    );
}

export default Stack;