import { useSettings } from "@/components/context/useSettings";
import React from "react";
import styles from "./SettingsPanel.module.css";

const SettingsPanel = () => {
    const {availableTools, selectedTools, usePower, setSelectedTools, setUsePower} = useSettings();

    const handleToolSelection = (tool: string) => {
        if (selectedTools.includes(tool)) {
            setSelectedTools(selectedTools.filter((selectedTool) => selectedTool !== tool));
        } else {
            setSelectedTools([...selectedTools, tool]);
        }
    };

    const handleUsePowerToggle = () => {
        setUsePower(!usePower);
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>Settings</div>
            <div className={styles.settingslist}>
                <div className={styles.toggle}>
                    <label htmlFor="usePowerToggle">Use Power:</label>
                    <input
                        type="checkbox"
                        id="usePowerToggle"
                        name="usePowerToggle"
                        checked={usePower}
                        onChange={() => handleUsePowerToggle()}
                    />
                </div>
                <div className={styles.divider}/>
                <div className={styles.toolslist}>
                    {availableTools.map((tool) => (
                        <div key={tool} className={styles.toggle}>
                            <input
                                type="checkbox"
                                id={tool}
                                name={tool}
                                className={styles.toggle}
                                checked={selectedTools.includes(tool)}
                                onChange={() => handleToolSelection(tool)}
                            />
                            <label htmlFor={tool}>{tool}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;