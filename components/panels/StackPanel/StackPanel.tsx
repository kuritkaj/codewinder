import Button from "@/components/ui/common/Button/Button";
import Dialog from "@/components/ui/common/Dialog";
import DropdownMenu, { MenuItem } from "@/components/ui/common/DropDownMenu/DropDownMenu";
import { StackData } from "@/lib/types/DatabaseData";
import { ArrowRightIcon, DotsVerticalIcon, PlusCircledIcon, StackIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useState } from "react";
import styles from "./StackPanel.module.css";

type StackPanelProps = {
    onDelete?: (stack: StackData) => void;
    onRename?: (stack: StackData, newName: string) => void;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const StackPanel = ({onDelete, onRename, stack, stacks}: StackPanelProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogStack, setDialogStack] = useState<StackData | null>(null);

    const createMenuItems = (targetStack) => {
        const menuItems: MenuItem[] = [];
        if (onRename) menuItems.push({label: "Rename stack", onSelect: () => openDialog(targetStack)});
        if (onDelete) menuItems.push({
            label: "Delete stack", subItems: [{label: "Are you sure?", onSelect: () => handleDelete(targetStack)}]
        });
        return menuItems;
    }

    const handleDelete = (targetStack) => {
        if (onDelete && targetStack) onDelete(targetStack);
    }

    const handleDialogClose = () => {
        setDialogOpen(false);
    }

    const handleRename = (targetStack, newName) => {
        if (onRename && targetStack) onRename(targetStack, newName);
    }

    const openDialog = (targetStack) => {
        if (targetStack) {
            setDialogStack(targetStack);
            setDialogOpen(true);
        }
    }

    return (
        <>
            <div className={styles.panel}>
                <div className={styles.stackcontainer}>
                    {stacks && stacks.length > 0 && (
                        <>
                            <h2 className={styles.subheader}>Recent stacks</h2>
                            <ul className={styles.stacks}>
                                <li>
                                    <Link className={styles.link} href="/stacks">
                                        {stack ? (
                                            <PlusCircledIcon width={16} height={16}/>
                                        ) : (
                                            <ArrowRightIcon width={16} height={16}/>
                                        )}
                                        <span>New stack</span>
                                    </Link>
                                </li>
                                {stacks.map((sibling) => {
                                    const active = sibling.id === stack?.id
                                    return (
                                        <li key={sibling.id} className={active ? styles.activeitem : styles.listitem}>
                                            {active ? (
                                                <div className={styles.link}>
                                                    <ArrowRightIcon width={16} height={16}/>
                                                    <span>{sibling.name}</span>
                                                </div>
                                            ) : (
                                                <Link className={styles.link} href={`/stacks/${sibling.id}`}>
                                                    <StackIcon width={16} height={16}/>
                                                    <span>{sibling.name}</span>
                                                </Link>
                                            )}
                                            <DropdownMenu menuItems={
                                                createMenuItems(sibling)
                                            }>
                                                <Button id={sibling.id + "trigger"} className={styles.contextmenubutton}>
                                                    <DotsVerticalIcon width={16} height={16}/>
                                                </Button>
                                            </DropdownMenu>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </div>
            </div>
            <Dialog
                fields={
                    [{
                        label: "Name",
                        id: "name",
                        defaultValue: dialogStack?.name || "",
                    }]
                }
                open={dialogOpen}
                onClose={handleDialogClose}
                onSave={(fields) => handleRename(dialogStack, fields.name)}
                title="Rename stack"
            />
        </>
    );
}

export default StackPanel;