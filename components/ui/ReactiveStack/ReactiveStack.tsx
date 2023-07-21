import Link from "next/link";
import styles from "./ReactiveStack.module.css";

const ReactiveStack = async ({stack, stacks}) => {

    return (
        <div className={styles.stack}>
            {stacks && stacks.length > 0 && (
                <>
                    <h2 className={styles.subheader}>Recent stacks</h2>
                    <ul className={styles.stacks}>
                        {stacks.map((sibling) => {
                            if (sibling.id === stack.id) {
                                return (
                                    <li key={sibling.id} className={styles.active}>
                                        {sibling.name}
                                    </li>
                                );
                            } else {
                                return (
                                    <li key={sibling.id}>
                                        <Link href={`/stacks/${sibling.id}`}>{sibling.name}</Link>
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