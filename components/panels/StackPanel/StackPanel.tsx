import ReactiveStack from "@/components/ui/ReactiveStack";
import { Database } from "@/lib/types/Database";
import styles from "./StackPanel.module.css";

type StackData = Database["public"]["Tables"]["stacks"]["Row"];

type StackPanelProps = {
    stack?: StackData | null;
    stacks?: StackData[] | null;
}

const StackPanel = ({stack, stacks}: StackPanelProps) => {
    return (
        <div className={styles.panel}>
            <ReactiveStack stack={stack} stacks={stacks}/>
        </div>
    );
}

export default StackPanel;