import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LockClosedIcon, LockOpen1Icon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useState } from "react";

import styles from "./ToggleEditablePlugin.module.css";

export const ToggleEditablePlugin = () => {
    const [editor] = useLexicalComposerContext();
    const [locked, setLocked] = useState<boolean>(true);

    useEffect(() => {
        setLocked(!editor.isEditable());
    }, [editor]);

    const toggleEditable = useCallback(() => {
        editor.setEditable(!editor.isEditable());
        setLocked(!editor.isEditable());
    }, [editor]);

    // useEffect(() => {
    //     return editor.registerRootListener((rootElement, prevRootElement) => {
    //         // add the listener to the current root element
    //         if (rootElement) rootElement.addEventListener("dblclick", toggleEditable);
    //         // remove the listener from the old root element - make sure the ref to myListener
    //         // is stable so the removal works, and you avoid a memory leak.
    //         if (prevRootElement) prevRootElement.removeEventListener("dblclick", toggleEditable);
    //     });
    // }, [editor, toggleEditable]);

    return (
        <button type="button" className={styles.toggle} onClick={toggleEditable}>
            {locked ? (
                <LockClosedIcon className={styles.indicator}/>
            ) : (
                <LockOpen1Icon className={styles.indicator}/>
            )}
        </button>
    );
}

export default ToggleEditablePlugin;