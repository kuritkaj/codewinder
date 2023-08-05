import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LockClosedIcon, LockOpen1Icon } from "@radix-ui/react-icons";
import Button from "components/ui/common/Button";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

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

    useLayoutEffect(() => {
        return editor.registerEditableListener((editable) => {
            setLocked(!editable);
        });
    }, [editor]);

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