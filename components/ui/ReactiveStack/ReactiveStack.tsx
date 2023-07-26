import { ArrowRightIcon, PlusCircledIcon, StackIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import styles from "./ReactiveStack.module.css";

const ReactiveStack = ({stack, stacks}) => {
    return (
        <div className={styles.stack}>
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
                                    <li key={sibling.id} className={styles.active}>
                                        <div className={styles.link}>
                                            <ArrowRightIcon width={16} height={16}/>
                                            <span>{sibling.name}</span>
                                        </div>
                                    </li>
                                );
                            } else {
                                return (
                                    <li key={sibling.id}>
                                        <Link className={styles.link} href={`/stacks/${sibling.id}`}>
                                            <StackIcon width={16} height={16}/>
                                            <span>{sibling.name}</span>
                                        </Link>
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