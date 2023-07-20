import { Database } from "@/lib/types/Database";
import styles from "./ReactiveStack.module.css";

type StackData = Database["public"]["Tables"]["stacks"]["Row"];

const ReactiveStack = ({stack}) => {
    return (
        <div className={styles.stack}>
            <h1>{stack.name}</h1>
        </div>
    )
}

export default ReactiveStack;