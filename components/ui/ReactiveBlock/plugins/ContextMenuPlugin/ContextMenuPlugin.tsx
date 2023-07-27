import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import Button from "@/components/ui/common/Button";
import DropdownMenu from "@/components/ui/common/DropDownMenu";
import { MessageType } from "@/lib/types/MessageType";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import styles from "./ContextMenuPlugin.module.css";

const ContextMenuPlugin = () => {
    const {namespace} = useNamespace();
    const {addBlock, deleteBlock} = useNotebook();

    function handleOnDelete() {
        deleteBlock(namespace);
    }

    function handleOnInsertAbove() {
        addBlock({
            editable: true,
            markdown: "",
            namespace: Math.random().toString(),
            type: MessageType.UserMessage
        }, namespace, true);
    }

    function handleOnInsertBelow() {
        addBlock({
            editable: true,
            markdown: "",
            namespace: Math.random().toString(),
            type: MessageType.UserMessage
        }, namespace, false);
    }

    const menuItems = [
        {
            label: "Insert above",
            onSelect: handleOnInsertAbove
        },
        {
            label: "Insert below",
            onSelect: handleOnInsertBelow
        },
        {
            label: "Delete",
            subItems: [
                {
                    label: "Are you sure?",
                    onSelect: handleOnDelete
                }
            ]
        }
    ];

    return (
        <DropdownMenu menuItems={menuItems}>
            <Button className={styles.contextmenubutton}><DotsVerticalIcon width={16} height={16}/></Button>
        </DropdownMenu>
    );
}

export default ContextMenuPlugin;