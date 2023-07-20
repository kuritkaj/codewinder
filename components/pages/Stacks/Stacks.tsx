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
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();

    const onSearch = async (userInput: string) => {
        const {error} = await supabase.from("stacks").insert({name: userInput}).select().maybeSingle();
        if (error) {
            console.log("Error: ", error);
            alert(error.message);
        } else {
            router.push(`/stacks/new`);
        }
    }

    return (
        <UserContextProvider supabase={supabase}>
            <div className={styles.fullscreen}>
                <Header/>
                <main className={styles.main}>
                    <div className={styles.search}>
                        <Search handleSubmit={onSearch}/>
                    </div>
                    <StacksPanel stacks={stacks}/>
                </main>
            </div>
        </UserContextProvider>
    );
}

export default Stack;