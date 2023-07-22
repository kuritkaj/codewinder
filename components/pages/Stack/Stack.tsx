"use client";

import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import StackPanel from "@/components/panels/StackPanel";
import Button from "@/components/ui/common/Button";
import { Database } from "@/lib/types/Database";
import { PlusIcon } from "@radix-ui/react-icons";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React from "react";

type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type NotesProps = {
    notebooks?: NotebookData[] | null;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const Stack = ({notebooks: init, stack, stacks}: NotesProps) => {
    const supabase = createClientComponentClient<Database>();
    const [notebooks, setNotebooks] = React.useState<NotebookData[]>(init || []);

    const createNotebook = async () => {
        if (stack) {
            const {data: notebook} = await supabase.from("notebooks").insert({stack_id: stack.id});
            if (notebook) {
                setNotebooks(prevNotebooks => [...prevNotebooks, notebook]);
                await supabase.from("stacks").update({id: stack.id, notebooks: notebooks.map(n => n.id)});
            }
        }
    }

    const deleteNotebook = async (notebook) => {
        if (notebook && stack) {
            await supabase.from("notebooks").delete().eq("id", notebook.id);
            setNotebooks(prevNotebooks => prevNotebooks.filter(n => n.id !== notebook.id));
            await supabase.from("stacks").update({id: stack.id, notebooks: notebooks.map(n => n.id)});
        }
    }

    return stack ? (
        <>
            <div className={styles.stacks}>
                <StackPanel stack={stack} stacks={stacks}/>
            </div>
            {notebooks && notebooks.length > 0 &&
                notebooks.map((notebook) => (
                    <div key={notebook.id}>
                        <Notebook notebook={notebook} onDelete={deleteNotebook}/>
                    </div>)
                )
            }
            <div className={styles.addnotebook}>
                <Button className={styles.addbutton} onClick={createNotebook}>
                    <PlusIcon width={20} height={20}/>
                </Button>
            </div>
        </>
    ) : "Stack not found.";
}

export default Stack;