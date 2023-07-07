import useSettings from "@/components/context/useSettings";
import { ChangeEvent } from "react";
import styles from "./SettingsPanel.module.css";

const SettingsPanel = () => {
    const {hasServerKey, localKey, setLocalKey, setUsePower, usePower} = useSettings();

    const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLocalKey(event.target.value);
    };

    const handleUsePowerToggle = () => {
        setUsePower(!usePower);
    };

    return (
        <div className={styles.panel}>
            <div className={styles.settingslist}>
                <div className={styles.toggle}>
                    <label htmlFor="usePowerToggle">{usePower ? 'Power:' : 'Speed:'}</label>
                    <input
                        type="checkbox"
                        id="usePowerToggle"
                        name="usePowerToggle"
                        checked={usePower}
                        onChange={() => handleUsePowerToggle()}
                    />
                </div>
                <div className={styles.divider}/>
                {!hasServerKey && (
                    <div className={styles.apiKeyInput}>
                        <label htmlFor="apiKey">OpenAI API Key:</label>
                        <input
                            type="password"
                            id="apiKey"
                            name="apiKey"
                            value={localKey}
                            onChange={handleApiKeyChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPanel;