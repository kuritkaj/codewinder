import useNamespace from "@/components/context/useNamespace";
import BaseButton from "@/components/ui/BaseButton";
import { useSortable } from "@dnd-kit/sortable";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import styles from "./DragDropPlugin.module.css";

export const DragDropPlugin = () => {
    const {namespace} = useNamespace();

    const {
        listeners,
        setActivatorNodeRef,
    } = useSortable({id: namespace});

    return (
        <BaseButton ref={setActivatorNodeRef} className={styles.draggable} {...listeners}>
            <DragHandleDots2Icon className={styles.handle}/>
        </BaseButton>
    );
}