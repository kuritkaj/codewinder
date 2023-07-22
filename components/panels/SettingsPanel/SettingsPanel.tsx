import useSettings from "@/components/context/useSettings";
import Button from "@/components/ui/common/Button";
import { Cross1Icon } from "@radix-ui/react-icons";
import * as Switch from '@radix-ui/react-switch';
import styles from "./SettingsPanel.module.css";

type SettingsProps = {
    onDelete: () => void;
}

const SettingsPanel = ({onDelete}) => {
    const {setUsePower, usePower} = useSettings();

    const handleUsePowerToggle = (checked: boolean) => {
        setUsePower(checked);
    };

    return (
        <div className={styles.panel}>
            <div className={styles.settingsleft}>
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
                        <Switch.Thumb className={styles.switchthumb}/>
                    </Switch.Root>
                </div>
            </div>
            <div className={styles.divider}/>
            <div className={styles.settingsright}>
                <Button className={styles.button} onClick={onDelete}>
                    <Cross1Icon width={16} height={16}/>
                </Button>
            </div>
        </div>
    );
};

export default SettingsPanel;