import useNamespace from "@/components/context/useNamespace";
import useNotebook from "@/components/context/useNotebook";
import useSettings from "@/components/context/useSettings";
import Button from "@/components/ui/common/Button";
import DropdownMenu from "@/components/ui/common/DropDownMenu";
import { streamIntelligence } from "@/lib/intelligence/streamIntelligence";
import { MessageType } from "@/lib/types/MessageType";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import styles from "./ContextMenuPlugin.module.css";

const ContextMenuPlugin = () => {
    const {namespace} = useNamespace();
    const {addBlock, appendToBlock, getBlock, getContents, removeBlock, replaceBlock} = useNotebook();
    const {usePower} = useSettings();

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

        await streamIntelligence({
            context: getContents(block.namespace),
            objective: block.markdown,
            onError: (error) => {
                replaceBlock({
                    editable: block.editable,
                    namespace: block.namespace,
                    markdown: error.message,
                    type: MessageType.ApiMessage,
                });
            },
            onOpen: () => {
                replaceBlock({
                    editable: block.editable,
                    namespace: block.namespace,
                    markdown: "",
                    type: MessageType.ApiMessage,
                });
            },
            onMessage: (message) => {
                if (message.includes("{clear}")) {
                    replaceBlock({
                        editable: block.editable,
                        namespace: block.namespace,
                        markdown: message.split("{clear}").pop() || "",
                        type: MessageType.ApiMessage,
                    });
                } else {
                    appendToBlock({
                        namespace: block.namespace,
                        markdown: message,
                    });
                }
            },
            usePower
        })
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