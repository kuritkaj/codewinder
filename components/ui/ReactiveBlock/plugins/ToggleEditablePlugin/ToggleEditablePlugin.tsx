import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";

import styles from "./ToggleEditablePlugin.module.css";

export const ToggleEditablePlugin = () => {
    const [editor] = useLexicalComposerContext();
    const [locked, setLocked] = useState<boolean>();

    useEffect(() => {
        setLocked(!editor.isEditable());
    }, [editor]);

    const toggleEditable = useCallback(() => {
        editor.setEditable(!editor.isEditable());
        setLocked(!editor.isEditable());
    }, [editor]);

    return (
        <button type="button" className={styles.toggle} onClick={toggleEditable}>
            <i className={locked ? "bi-lock" : "bi-unlock"}/>
        </button>
    );
}

export default ToggleEditablePlugin;