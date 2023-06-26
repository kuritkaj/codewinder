import { createContext, useState } from "react";

export interface Settings {
    availableTools: string[];
    selectedTools: string[];
    usePower: boolean;
}

interface SettingsContextProps extends Settings {
    saveSettings?: (values: Settings) => void;
    setSelectedTools?: (selectedTools: string[]) => void;
    setUsePower?: (usePower: boolean) => void;
}

const defaultSettings = {
    availableTools: [],
    selectedTools: [],
    usePower: true
};

const SettingsContext = createContext<SettingsContextProps>({
    ...defaultSettings
});

export const SettingsProvider = ({ children, settings }) => {
    const [currentSettings, setCurrentSettings] = useState<Settings>(
        settings || defaultSettings
    );

    const setSelectedTools = (selectedTools: string[]) => {
        setCurrentSettings(state => ({
            ...state,
            selectedTools
        }));
    }

    const setUsePower = (usePower: boolean) => {
        setCurrentSettings(state => ({
            ...state,
            usePower
        }));
    }

    const saveSettings = (values) => {
        setCurrentSettings(values)
    };

    return (
        <SettingsContext.Provider value={{ ...currentSettings, saveSettings, setSelectedTools, setUsePower }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const SettingsConsumer = SettingsContext.Consumer;

export default SettingsContext;