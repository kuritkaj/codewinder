import Button from "components/ui/common/Button";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LockClosedIcon, LockOpen1Icon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useState } from "react";

import styles from "./ToggleEditablePlugin.module.css";

const ToggleEditablePlugin = () => {
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
        <Button
            aria-label="Toggle readonly mode"
            className={styles.toggle}
            onClick={toggleEditable}
        >
            {locked ? (
                <LockClosedIcon className={styles.lock} width={16} height={16}/>
            ) : (
                <LockOpen1Icon className={styles.lock} width={16} height={16}/>
            )}
        </Button>
    );
}

export default ToggleEditablePlugin;