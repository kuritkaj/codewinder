"use client";

import styles from "@/components/pages/Stacks/Stacks.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Search from "@/components/ui/Search/Search";

import { Database } from "@/lib/types/Database";
import { StackData } from "@/lib/types/DatabaseData";
import { logError } from "@/lib/util/logger";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React from "react";

type StacksProps = {
    stacks?: StackData[] | null;
}

const Stack = ({stacks}: StacksProps) => {
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();

    const createStack = async (userInput: string) => {
        if (!userInput) return;

        const {data: stack, error: e1} = await supabase.from("stacks").insert({name: userInput}).select().maybeSingle();
        if (e1) logError(e1.message, e1);
        if (stack) {
            const {data: notebook, error: e2} = await supabase.from("notebooks").insert({stack_id: stack.id}).select().maybeSingle();
            if (e2) logError(e2.message, e2);
            if (notebook) {
                const {error: e3} = await supabase.from("stacks").update({id: stack.id, notebooks: [notebook.id]}).eq("id", stack.id);
                if (e3) logError(e3.message, e3);
                router.push(`/stacks/${stack.id}`);
            }
        }
    }

    const deleteStack = async (target: StackData) => {
        if (target) {
            const {error: e1} = await supabase.from("stacks").delete().eq("id", target.id);
            if (e1) logError(e1.message, e1);
            router.refresh();
        }
    }

    const renameStack = async (target: StackData, newName: string) => {
        if (target) {
            const {error: e1} = await supabase.from("stacks").update({name: newName}).eq("id", target.id);
            if (e1) logError(e1.message, e1);
            router.refresh();
        }
    }

    return (
        <>
            <div className={styles.stacks}>
                <StackPanel onDelete={deleteStack} onRename={renameStack} stacks={stacks}/>
            </div>
            <div className={styles.search}>
                <Search handleSubmit={createStack}/>
            </div>
        </>
    );
}

export default Stack;