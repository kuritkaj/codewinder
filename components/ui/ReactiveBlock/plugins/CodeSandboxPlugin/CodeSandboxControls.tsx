import CopyButton from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/ui/CopyButton";
import { useSandpack } from "@codesandbox/sandpack-react";
import styles from "./CodeSandboxControls.module.css";

const CodeSandboxControls = () => {
    const {sandpack} = useSandpack();

    return (
        <div className={styles.controls}>
            <div className={styles.language}>Language: {sandpack.environment}</div>
            <div className={styles.copy}>
                <CopyButton/>
            </div>
        </div>
    );
}

export default CodeSandboxControls;