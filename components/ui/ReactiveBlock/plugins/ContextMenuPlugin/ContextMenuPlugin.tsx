import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import Button from "@/components/ui/common/Button";
import DropdownMenu from "@/components/ui/common/DropDownMenu";
import { MessageType } from "@/lib/types/MessageType";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import styles from "./ContextMenuPlugin.module.css";

const ContextMenuPlugin = () => {
    const {addBlock, generateBlock, getBlock, removeBlock} = useNotebook();
    const [editor] = useLexicalComposerContext();
    const {namespace} = useNamespace();

    const handleOnDelete = () => {
        removeBlock(namespace);
    }

    const handleOnInsertAbove = () => {
        addBlock({
            editable: true,
            markdown: "",
            type: MessageType.UserMessage
        }, namespace, true);
    }

    const handleOnInsertBelow = () => {
        addBlock({
            editable: true,
            markdown: "",
            type: MessageType.UserMessage
        }, namespace, false);
    }

    const handleRegenerateBlock = async () => {
        const block = getBlock(namespace);
        if (!block) return;

        editor.setEditable(false); // Without setting to false, this spins the browser into an infinite loop
        await generateBlock(block.markdown, block.namespace);
    }

    const menuItems = [
        {
            label: "Regenerate block",
            onSelect: handleRegenerateBlock
        },
        {
            label: "Insert block above",
            onSelect: handleOnInsertAbove
        },
        {
            label: "Insert block below",
            onSelect: handleOnInsertBelow
        },
        {
            label: "Delete block",
            subItems: [
                {
                    label: "Are you sure?",
                    onSelect: handleOnDelete
                }
            ]
        },
    ];

    return (
        <DropdownMenu menuItems={menuItems}>
            <Button id={namespace + "trigger"} className={styles.contextmenubutton}><DotsVerticalIcon width={16} height={16}/></Button>
        </DropdownMenu>
    );
}

export default ContextMenuPlugin;