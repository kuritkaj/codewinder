"use client";

import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Button from "@/components/ui/common/Button";
import { Database, Json } from "@/lib/types/Database";
import { logError } from "@/lib/util/logger";
import { PlusIcon } from "@radix-ui/react-icons";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React, { useLayoutEffect } from "react";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type NotesProps = {
    notebooks?: NotebookData[] | null;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const Stack = ({notebooks, stack, stacks}: NotesProps) => {
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();

    useLayoutEffect(() => {
        if (stack) {
            const anchorElement = document.getElementById(stack.id);
            if (anchorElement) {
                anchorElement.scrollIntoView({ behavior: "smooth", inline: "center" });
            }
        }
    }, [stack]);

    const createNotebook = async () => {
        if (stack) {
            const {data: notebook, error: e1} = await supabase.from("notebooks").insert({stack_id: stack.id}).select().maybeSingle();
            if (e1) logError(e1.message, e1);
            if (notebook) {
                const newOrder = [...notebooks || [], notebook];
                const {error: e2} = await supabase.from("stacks").update({notebooks: newOrder.map(n => n.id)}).eq("id", stack.id);
                if (e2) logError(e2.message, e2);
                router.refresh();
                router.replace(`/stacks/${stack.id}#${notebook.id}`);
            }
        }
    };

    const deleteNotebook = async (notebook) => {
        if (notebook && stack) {
            const {error: e1} = await supabase.from("notebooks").delete().eq("id", notebook.id);
            if (e1) logError(e1.message, e1);
            const newOrder = notebooks?.splice(notebooks.findIndex(n => n.id === notebook.id), 1) || []
            const {error: e2} = await supabase.from("stacks").update({notebooks: newOrder.map(n => n.id)}).eq("id", stack.id);
            if (e2) logError(e2.message, e2);
            router.refresh();
        }
    };

    const deleteStack = async (target) => {
        if (stack) {
            const {error: e1} = await supabase.from("stacks").delete().eq("id", target.id);
            if (e1) logError(e1.message, e1);
            if (target.id === stack.id) {
                router.refresh();
                router.replace("/stacks");
            } else {
                router.refresh();
            }
        }
    }

    const saveNotebook = async (notebook, blocks) => {
        if (notebook && stack) {
            const json = blocks as unknown as Json[];
            const {error: e1} = await supabase.from("notebooks").update({blocks: json}).eq("id", notebook.id);
            if (e1) logError(e1.message, e1);
        }
    }

    return stack ? (
        <>
            <div className={styles.stacks}>
                <StackPanel onDelete={deleteStack} stack={stack} stacks={stacks}/>
            </div>
            <div className={styles.notebooks}>
                {notebooks && notebooks.length > 0 && notebooks.map((notebook) => (
                    <div key={notebook.id} id={notebook.id}>
                        <Notebook notebook={notebook} onDelete={deleteNotebook} onSave={saveNotebook} stack={stack}/>
                    </div>
                ))}
                <div className={styles.addnotebook}>
                    <Button className={styles.addbutton} onClick={createNotebook}>
                        <PlusIcon width={20} height={20}/>
                    </Button>
                </div>
            </div>
        </>
    ) : "Stack not found.";
}

export default Stack;