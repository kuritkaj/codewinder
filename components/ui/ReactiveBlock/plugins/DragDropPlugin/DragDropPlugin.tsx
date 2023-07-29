import useNamespace from "@/components/context/useNamespace";
import Button from "@/components/ui/common/Button";
import { useSortable } from "@dnd-kit/sortable";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import styles from "./DragDropPlugin.module.css";

const DragDropPlugin = () => {
    const {namespace} = useNamespace();

    const {
        listeners,
        setActivatorNodeRef,
    } = useSortable({
        id: namespace
    });

    return (
        <Button
            aria-label="Drag handle to move block"
            ref={setActivatorNodeRef}
            className={styles.draggable}
            {...listeners}
        >
            <DragHandleDots2Icon width={16} height={16}/>
        </Button>
    );
}

export default DragDropPlugin;