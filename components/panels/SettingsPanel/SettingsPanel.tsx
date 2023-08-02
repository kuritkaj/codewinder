import useSettings from "@/components/context/useSettings";
import Button from "@/components/ui/common/Button";
import DropdownMenu from "@/components/ui/common/DropDownMenu/DropDownMenu";
import { NotebookData } from "@/lib/types/DatabaseData";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import styles from "./SettingsPanel.module.css";

type SettingsProps = {
    notebook: NotebookData;
    onClear: () => void;
    onDelete: () => void;
}

const SettingsPanel = ({notebook, onClear, onDelete}: SettingsProps) => {
    const {setUsePower, usePower} = useSettings();

    const handleOnClear = () => {
        if (onClear) onClear();
    }

    const handleOnDelete = () => {
        if (onDelete) onDelete();
    }

    const handleUsePowerToggle = (checked: boolean) => {
        setUsePower(checked);
    };

    const menuItems = [
        {
            label: "Clear notebook",
            subItems: [
                {
                    label: "Are you sure?",
                    onSelect: handleOnClear,
                }
            ]
        },
        {
            label: "Delete notebook",
            subItems: [
                {
                    label: "Are you sure?",
                    onSelect: handleOnDelete,
                }
            ]
        }
    ];

    return (
        <div className={styles.panel}>
            <div className={styles.settingsleft}>
                {/*<div className={styles.switch}>*/}
                {/*    <label className={styles.switchlabel} htmlFor="usePowerToggle">*/}
                {/*        {usePower ? 'Power:' : 'Speed:'}*/}
                {/*    </label>*/}
                {/*    <Switch.Root*/}
                {/*        aria-label="Toggle between power and speed modes"*/}
                {/*        className={styles.switchroot}*/}
                {/*        id="usePowerToggle"*/}
                {/*        name="usePowerToggle"*/}
                {/*        checked={usePower}*/}
                {/*        onCheckedChange={handleUsePowerToggle}*/}
                {/*    >*/}
                {/*        <Switch.Thumb className={styles.switchthumb}/>*/}
                {/*    </Switch.Root>*/}
                {/*</div>*/}
            </div>
            <div className={styles.divider}/>
            <div className={styles.settingsright}>
                <DropdownMenu menuItems={menuItems}>
                    <Button id={notebook.id + "trigger"} className={styles.contextmenubutton}>
                        <DotsVerticalIcon width={16} height={16}/>
                    </Button>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default SettingsPanel;