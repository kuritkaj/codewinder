import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import Button from "@/components/ui/common/Button";
import { MessageType } from "@/lib/types/MessageType";
import * as DropDownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
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

    return (
        <DropDownMenu.Root>
            <DropDownMenu.Trigger asChild>
                <Button className={styles.trigger}><DotsVerticalIcon width={16} height={16}/></Button>
            </DropDownMenu.Trigger>
            <DropDownMenu.Portal>
                <DropDownMenu.Content className={styles.content}>
                    <DropDownMenu.Sub>
                        <DropDownMenu.Item
                            className={styles.menuitem}
                            onSelect={handleOnInsertAbove}
                        >
                            Insert above
                        </DropDownMenu.Item>
                        <DropDownMenu.Item
                            className={styles.menuitem}
                            onSelect={handleOnInsertBelow}
                        >
                            Insert below
                        </DropDownMenu.Item>
                        <DropDownMenu.SubTrigger className={styles.subtrigger}>
                            Delete <ChevronRightIcon className={styles.rightslot} width={16} height={16}/>
                        </DropDownMenu.SubTrigger>
                        <DropDownMenu.Portal>
                            <DropDownMenu.SubContent
                                className={styles.subcontent}
                                sideOffset={10}
                                alignOffset={-4}
                            >
                                <DropDownMenu.Item
                                    className={styles.menuitem}
                                    onSelect={handleOnDelete}
                                >
                                    Are you sure?
                                </DropDownMenu.Item>
                            </DropDownMenu.SubContent>
                        </DropDownMenu.Portal>
                    </DropDownMenu.Sub>
                </DropDownMenu.Content>
            </DropDownMenu.Portal>
        </DropDownMenu.Root>
    );
}

export default ContextMenuPlugin;