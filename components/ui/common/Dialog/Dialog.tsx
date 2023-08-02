import Button from "@/components/ui/common/Button";
import * as Interactive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ReactNode, useEffect, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./Dialog.module.css";

export type DialogField = {
    label: string;
    id: string;
    defaultValue: string;
}

type DialogProps = {
    fields: DialogField[];
    children?: ReactNode;
    title?: string;
    description?: string;
    onClose?: () => void;
    onSave?: (values: { [key: string]: string }) => void;
    open?: boolean;
}

const Dialog = ({fields, children, open: controlled = false, onClose, onSave, title, description}: DialogProps) => {
    const [open, setOpen] = useState(false);
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});

    // Initialize fieldValues with default values
    useEffect(() => {
        const initialValues = fields.reduce((acc, field) => {
            acc[field.id] = field.defaultValue;
            return acc;
        }, {} as { [key: string]: string });

        setFieldValues(initialValues);
    }, [fields]);

    // Update controlled state
    useEffect(() => {
        setOpen(controlled);
    }, [controlled]);

    // Prevent blank submissions and allow for multiline input
    const handleEnter = async (e: any) => {
        if (e.key === "Enter") {
            if (!e.shiftKey) {
                handleSave();
                if (onClose) onClose();
            }
        }
    };

    const handleInputChange = (id: string, value: string) => {
        setFieldValues(prev => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(fieldValues);
        }
    };

    return (
        <Interactive.Root open={open} onOpenChange={(open) => {
            setOpen(open);
            if (onClose) onClose();
        }}>
            {children && (
                <Interactive.Trigger asChild>
                    {children}
                </Interactive.Trigger>
            )}
            <Interactive.Portal>
                <Interactive.Overlay className={styles.overlay}/>
                <Interactive.Content className={styles.content}>
                    <Interactive.Title className={styles.title}>{title}</Interactive.Title>
                    <Interactive.Description className={styles.description}>
                        {description}
                    </Interactive.Description>
                    {fields.map(field => (
                        <fieldset className={styles.fieldset} key={field.id}>
                            <label className={styles.label} htmlFor={field.id}>
                                {field.label}
                            </label>
                            <TextareaAutosize
                                className={styles.input}
                                id={field.id}
                                onKeyDown={handleEnter}
                                value={fieldValues[field.id]}
                                minRows={1}
                                maxRows={3}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                            />
                        </fieldset>
                    ))}
                    <div style={{display: "flex", marginTop: 25, justifyContent: "flex-end"}}>
                        <Interactive.Close asChild>
                            <Button className={styles.savebutton} onClick={handleSave}>Save changes</Button>
                        </Interactive.Close>
                    </div>
                    <Interactive.Close asChild>
                        <Button className={styles.closebutton} aria-label="Close">
                            <Cross2Icon/>
                        </Button>
                    </Interactive.Close>
                </Interactive.Content>
            </Interactive.Portal>
        </Interactive.Root>
    );
};

export default Dialog;
