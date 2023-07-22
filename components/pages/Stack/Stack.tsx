"use client";

import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Button from "@/components/ui/common/Button";
import { Database } from "@/lib/types/Database";
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
            const {data: notebook} = await supabase.from("notebooks").insert({stack_id: stack.id}).select().maybeSingle();
            if (notebook) {
                const newOrder = [...notebooks, notebook];
                await supabase.from("stacks").update({notebooks: newOrder.map(n => n.id)}).eq("id", stack.id);
                router.refresh();
                router.replace(`/stacks/${stack.id}#${notebook.id}`, {shallow: true});
            }
        }
    };

    const deleteNotebook = async (notebook) => {
        if (notebook && stack) {
            await supabase.from("notebooks").delete().eq("id", notebook.id);
            const newOrder = [...notebooks, notebook];
            await supabase.from("stacks").update({notebooks: newOrder.map(n => n.id)}).eq("id", stack.id);
            router.refresh();
        }
    };

    return stack ? (
        <>
            <div className={styles.stacks}>
                <StackPanel stack={stack} stacks={stacks}/>
            </div>
            <div className={styles.notebooks}>
                {notebooks && notebooks.length > 0 && notebooks.map((notebook) => (
                    <div key={notebook.id} id={notebook.id}><Notebook notebook={notebook} onDelete={deleteNotebook}/></div>
                ))}
                {(!notebooks || notebooks.length === 0) && (
                    <div className={styles.addnotebook}>
                        <Button className={styles.addbutton} onClick={createNotebook}>
                            <PlusIcon width={20} height={20}/>
                        </Button>
                    </div>
                )}
            </div>
        </>
    ) : "Stack not found.";
}

export default Stack;