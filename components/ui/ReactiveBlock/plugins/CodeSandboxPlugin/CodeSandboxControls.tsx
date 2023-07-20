import Button from "@/components/ui/common/Button";
import CopyButton from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/ui/CopyButton";
import { useSandpack } from "@codesandbox/sandpack-react";
import { AllSidesIcon } from "@radix-ui/react-icons";
import styles from "./CodeSandboxControls.module.css";

export type CodeSandboxControlsProps = {
    className?: string;
    language?: string;
    togglePreview: () => void;
}

const CodeSandboxControls = ({className, language, togglePreview}: CodeSandboxControlsProps) => {
    const {sandpack} = useSandpack();

    return (
        <div className={`${className || ""} ${styles.controls} sp-stack`}>
            <div className={styles.language}>({language} - {sandpack.environment})</div>
            <div className={styles.toggles}>
                <Button onClick={togglePreview}>
                    <AllSidesIcon width={16} height={16}/>
                </Button>
            </div>
            <div className={styles.copy}>
                <CopyButton/>
            </div>
        </div>
    );
}

export default CodeSandboxControls;