"use client";

import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Button from "@/components/ui/common/Button";
import { Database } from "@/lib/types/Database";
import { PlusIcon } from "@radix-ui/react-icons";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React, { useCallback, useState } from "react";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type NotesProps = {
    notebooks?: NotebookData[] | null;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const Stack = ({notebooks: init, stack, stacks}: NotesProps) => {
    const supabase = createClientComponentClient<Database>();
    const [notebooks, setNotebooks] = useState<NotebookData[]>(init || []);

    const createNotebook = useCallback(async () => {
        if (stack) {
            const {data: notebook} = await supabase.from("notebooks").insert({stack_id: stack.id});
            if (notebook) {
                setNotebooks(prevNotebooks => [...prevNotebooks, notebook]);
                await supabase.from("stacks").update({id: stack.id, notebooks: notebooks.map(n => n.id)});
            }
        }
    }, [stack, supabase, notebooks]);

    const deleteNotebook = useCallback(async (notebook) => {
        if (notebook && stack) {
            await supabase.from("notebooks").delete().eq("id", notebook.id);
            setNotebooks(prevNotebooks => prevNotebooks.filter(n => n.id !== notebook.id));
            await supabase.from("stacks").update({id: stack.id, notebooks: notebooks.map(n => n.id)});
        }
    }, [notebooks, stack, supabase]);

    return stack ? (
        <>
            <div className={styles.stacks}>
                <StackPanel stack={stack} stacks={stacks}/>
            </div>
            <div className={styles.notebooks}>
                {notebooks && notebooks.length > 0 && notebooks.map((notebook) => (
                    <a key={notebook.id} href={`#${notebook.id}`}><Notebook notebook={notebook} onDelete={deleteNotebook}/></a>
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