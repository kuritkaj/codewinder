import Button from "@/components/ui/common/Button";
import CopyButton from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/ui/CopyButton";
import { useSandpack } from "@codesandbox/sandpack-react";
import { DoubleArrowDownIcon, DragHandleHorizontalIcon, PlayIcon } from "@radix-ui/react-icons";
import styles from "./CodeSandboxControls.module.css";

export type CodeSandboxControlsProps = {
    className?: string;
    language?: string;
    showConsole?: boolean;
    showPreview?: boolean;
    toggleConsole: () => void;
    togglePreview: () => void;
}

const CodeSandboxControls = ({className, language, showConsole, showPreview, toggleConsole, togglePreview}: CodeSandboxControlsProps) => {
    const {sandpack} = useSandpack();

    return (
        <div className={`${className || ""} ${styles.controls} sp-stack`}>
            <div className={styles.language}>({language} - {sandpack.environment})</div>
            <div className={styles.toggles}>
                <Button onClick={togglePreview}>
                    {showPreview ? <DoubleArrowDownIcon width={16} height={16}/> : <PlayIcon width={16} height={16}/>}
                </Button>
                <Button onClick={toggleConsole}>
                    {showConsole ? <DoubleArrowDownIcon width={16} height={16}/> : <DragHandleHorizontalIcon width={16} height={16}/>}
                </Button>
            </div>
            <div className={styles.copy}>
                <CopyButton/>
            </div>
        </div>
    );
}

export default CodeSandboxControls;