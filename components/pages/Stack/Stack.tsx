"use client";

import Notebook from "@/components/pages/Stack/Notebook";
import styles from "@/components/pages/Stack/Stack.module.css";
import StackPanel from "@/components/panels/StackPanel";
import React from "react";

type NotesProps = {
    notebooks?: NotebookData[] | null;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const Stack = ({notebooks, stack, stacks}: NotesProps) => {
    return (
        <>
            {stack &&
                <div className={styles.stacks}>
                    <StackPanel stack={stack} stacks={stacks}/>
                </div>
            }
            {notebooks && notebooks.length > 0 ?
                notebooks.map((notebook) => (
                    <div key={notebook.id}>
                        <Notebook/>
                    </div>)
                ) :
                <Notebook/>
            }
        </>
    );
}

export default Stack;