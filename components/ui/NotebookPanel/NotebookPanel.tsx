import ReactiveNotebook from "@/components/ui/ReactiveNotebook";
import React from "react";
import styles from "./NotebookPanel.module.css";

const NotebookPanel = () => {
    return (
        <>
            <div className={styles.notebook}>
                <ReactiveNotebook/>
            </div>
        </>
    );
}

export default NotebookPanel;