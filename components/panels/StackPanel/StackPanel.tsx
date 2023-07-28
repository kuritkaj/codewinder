import ReactiveStack from "@/components/ui/ReactiveStack";
import { Database } from "@/lib/types/Database";
import styles from "./StackPanel.module.css";

type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type StackPanelProps = {
    onDelete?: (stack: StackData) => void;
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const StackPanel = ({onDelete, stack, stacks}: StackPanelProps) => {

    const handleDelete = () => {
        if (onDelete && stack) onDelete(stack);
    }

    return (
        <div className={styles.panel}>
            <ReactiveStack onDelete={handleDelete} stack={stack} stacks={stacks}/>
        </div>
    );
}

export default StackPanel;