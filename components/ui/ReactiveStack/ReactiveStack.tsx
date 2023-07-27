import Button from "@/components/ui/common/Button";
import { Database } from "@/lib/types/Database";
import { ArrowRightIcon, PlusCircledIcon, StackIcon, TrashIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import styles from "./ReactiveStack.module.css";

type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type ReactiveStackProps = {
    onDelete?: (stack: StackData) => void;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const ReactiveStack = ({onDelete, stack, stacks}: ReactiveStackProps) => {

    const handleDelete = (target) => {
        if (onDelete) onDelete(target);
    }

    return (
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
                                        <Button className={styles.delete} onClick={() => handleDelete(sibling)}>
                                            <TrashIcon width={16} height={16}/>
                                        </Button>
                                    </li>
                                );
                            } else {
                                return (
                                    <li key={sibling.id} className={styles.listitem}>
                                        <Link className={styles.link} href={`/stacks/${sibling.id}`}>
                                            <StackIcon width={16} height={16}/>
                                            <span>{sibling.name}</span>
                                        </Link>
                                        <Button className={styles.delete} onClick={() => handleDelete(sibling)}>
                                            <TrashIcon width={16} height={16}/>
                                        </Button>
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </>
            )}
        </div>
    )
}

export default ReactiveStack;