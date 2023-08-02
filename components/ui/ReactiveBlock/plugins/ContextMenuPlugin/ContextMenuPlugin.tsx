import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import Button from "@/components/ui/common/Button";
import DropdownMenu from "@/components/ui/common/DropDownMenu";
import { MessageType } from "@/lib/types/MessageType";
import { generateRandomString } from "@/lib/util/random";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import styles from "./ContextMenuPlugin.module.css";

const ContextMenuPlugin = () => {
    const {namespace} = useNamespace();
    const {addBlock, removeBlock} = useNotebook();

    function handleOnDelete() {
        removeBlock(namespace);
    }

    function handleOnInsertAbove() {
        addBlock({
            editable: true,
            markdown: "",
            namespace: generateRandomString(10),
            type: MessageType.UserMessage
        }, namespace, true);
    }

    function handleOnInsertBelow() {
        addBlock({
            editable: true,
            markdown: "",
            namespace: generateRandomString(10),
            type: MessageType.UserMessage
        }, namespace, false);
    }

    const menuItems = [
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
        }
    ];

    return (
        <DropdownMenu menuItems={menuItems}>
            <Button id={namespace + "trigger"} className={styles.contextmenubutton}><DotsVerticalIcon width={16} height={16}/></Button>
        </DropdownMenu>
    );
}

export default ContextMenuPlugin;