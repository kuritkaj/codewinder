import Button from "@/components/ui/common/Button/Button";
import DropdownMenu from "@/components/ui/common/DropDownMenu/DropDownMenu";
import { StackData } from "@/lib/types/DatabaseData";
import { ArrowRightIcon, DotsVerticalIcon, PlusCircledIcon, StackIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import styles from "./StackPanel.module.css";

type StackPanelProps = {
    onDelete?: (stack: StackData) => void;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const StackPanel = ({onDelete, stack, stacks}: StackPanelProps) => {

    const createMenuItems = (onDelete) => {
        return [
            {
                label: "Delete",
                subItems: [
                    {
                        label: "Are you sure?",
                        onSelect: onDelete
                    }
                ]
            }
        ];
    }

    const handleDelete = (stack) => {
        if (onDelete && stack) onDelete(stack);
    }

    return (
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
                                if (sibling.id === stack?.id) {
                                    return (
                                        <li key={sibling.id} className={styles.activeitem}>
                                            <div className={styles.link}>
                                                <ArrowRightIcon width={16} height={16}/>
                                                <span>{sibling.name}</span>
                                            </div>
                                            <DropdownMenu menuItems={createMenuItems(() => handleDelete(sibling))}>
                                                <Button id={sibling.id + "trigger"} className={styles.contextmenubutton}>
                                                    <DotsVerticalIcon width={16} height={16}/>
                                                </Button>
                                            </DropdownMenu>
                                        </li>
                                    );
                                } else {
                                    return (
                                        <li key={sibling.id} className={styles.listitem}>
                                            <Link className={styles.link} href={`/stacks/${sibling.id}`}>
                                                <StackIcon width={16} height={16}/>
                                                <span>{sibling.name}</span>
                                            </Link>
                                            <DropdownMenu menuItems={createMenuItems(() => handleDelete(sibling))}>
                                                <Button id={sibling.id + "trigger"} className={styles.contextmenubutton}>
                                                    <DotsVerticalIcon width={16} height={16}/>
                                                </Button>
                                            </DropdownMenu>
                                        </li>
                                    );
                                }
                            })}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
}

export default StackPanel;