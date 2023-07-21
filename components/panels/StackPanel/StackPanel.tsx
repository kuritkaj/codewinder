import ReactiveStack from "@/components/ui/ReactiveStack";
import styles from "./StackPanel.module.css";

const StackPanel = ({stack, stacks}) => {
    return (
        <div className={styles.panel}>
            <ReactiveStack stack={stack} stacks={stacks}/>
        </div>
    );
}

export default StackPanel;