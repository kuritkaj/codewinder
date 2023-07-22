"use client";

import styles from "@/components/pages/Stacks/Stacks.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Search from "@/components/ui/Search/Search";

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
        const {data: stack} = await supabase.from("stacks").insert({name: userInput}).select().maybeSingle();
        if (stack) router.push(`/stacks/${stack.id}`);
    }

    return (
        <>
            <div className={styles.stacks}>
                <StackPanel stacks={stacks}/>
            </div>
            <div className={styles.search}>
                <Search handleSubmit={onSearch}/>
            </div>
        </>
    );
}

export default Stack;