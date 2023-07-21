"use client";

import { UserContextProvider } from "@/components/context/UserContext";
import styles from "@/components/pages/Stacks/Stacks.module.css";
import Header from "@/components/ui/Header";
import Search from "@/components/ui/Search/Search";
import StacksPanel from "components/panels/StacksPanel";

import { Database } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React from "react";

type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type StacksProps = {
    session?: Session | null;
    stacks?: StackData[] | null;
}

const Stack = ({session, stacks}: StacksProps) => {
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();

    const onSearch = async (userInput: string) => {
        const {data: stack} = await supabase.from("stacks").insert({name: userInput}).select().maybeSingle();
        if (stack) router.push(`/stacks/${stack.id}`);
        else router.push(`/stacks/new`);
    }

    return (
        <UserContextProvider session={session} supabase={supabase}>
            <div className={styles.fullscreen}>
                <Header user={session?.user}/>
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