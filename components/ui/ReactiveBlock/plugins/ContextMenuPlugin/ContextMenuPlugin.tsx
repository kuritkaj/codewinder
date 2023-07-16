import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import { MessageType } from "@/lib/types/MessageType";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { ChevronRightIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import styles from "./ContextMenuPlugin.module.css";

function ContextMenuPlugin() {
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
        <ContextMenu.Root>
            <ContextMenuTrigger className={styles.trigger}>
                <DotsVerticalIcon width={16} height={16}/>
            </ContextMenuTrigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className={styles.content}>
                    <ContextMenu.Sub>
                        <ContextMenu.Item
                            className={styles.menuitem}
                            onSelect={handleOnInsertAbove}
                        >
                            Insert above
                        </ContextMenu.Item>
                        <ContextMenu.Item
                            className={styles.menuitem}
                            onSelect={handleOnInsertBelow}
                        >
                            Insert below
                        </ContextMenu.Item>
                        <ContextMenu.SubTrigger className={styles.subtrigger}>
                            Delete <ChevronRightIcon className={styles.rightslot} width={16} height={16}/>
                        </ContextMenu.SubTrigger>
                        <ContextMenu.Portal>
                            <ContextMenu.SubContent
                                className={styles.subcontent}
                                sideOffset={10}
                                alignOffset={-4}
                            >
                                <ContextMenu.Item
                                    className={styles.menuitem}
                                    onSelect={handleOnDelete}
                                >
                                    Are you sure?
                                </ContextMenu.Item>
                            </ContextMenu.SubContent>
                        </ContextMenu.Portal>
                    </ContextMenu.Sub>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}

export default ContextMenuPlugin;