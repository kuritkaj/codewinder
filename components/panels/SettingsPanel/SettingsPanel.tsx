import useSettings from "@/components/context/useSettings";
import { ChangeEvent } from "react";
import styles from "./SettingsPanel.module.css";
import * as Switch from '@radix-ui/react-switch';

const SettingsPanel = () => {
    const {hasServerKey, localKey, setLocalKey, setUsePower, usePower} = useSettings();

    const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target?.value) setLocalKey(event.target.value);
    };

    const handleUsePowerToggle = (checked: boolean) => {
        setUsePower(checked);
    };

    return (
        <div className={styles.panel}>
            <div className={styles.settingslist}>
                <div className={styles.switch}>
                    <label className={styles.switchlabel} htmlFor="usePowerToggle">
                        {usePower ? 'Power:' : 'Speed:'}
                    </label>
                    <Switch.Root
                        aria-label="Toggle between power and speed modes"
                        className={styles.switchroot}
                        id="usePowerToggle"
                        name="usePowerToggle"
                        checked={usePower}
                        onCheckedChange={handleUsePowerToggle}
                    >
                        <Switch.Thumb className={styles.switchthumb} />
                    </Switch.Root>
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