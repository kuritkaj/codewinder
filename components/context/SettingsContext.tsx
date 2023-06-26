import { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

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
    usePower: true,
};

const SettingsContext = createContext<SettingsContextProps>({
    ...defaultSettings,
});

export const SettingsProvider = ({ children, settings }) => {
    const [currentSettings, setCurrentSettings] = useState<Settings>(
        settings || defaultSettings
    );

    useEffect(() => {
        const usePowerCookie = Cookies.get("usePower");
        if (usePowerCookie !== undefined) {
            setCurrentSettings((state) => ({
                ...state,
                usePower: JSON.parse(usePowerCookie),
            }));
        }
    }, []);

    const setSelectedTools = (selectedTools: string[]) => {
        setCurrentSettings((state) => ({
            ...state,
            selectedTools,
        }));
    };

    const setUsePower = (usePower: boolean) => {
        setCurrentSettings((state) => ({
            ...state,
            usePower,
        }));
        Cookies.set("usePower", JSON.stringify(usePower));
    };

    const saveSettings = (values) => {
        setCurrentSettings(values);
        Cookies.set("usePower", JSON.stringify(values.usePower));
    };

    return (
        <SettingsContext.Provider
            value={{ ...currentSettings, saveSettings, setSelectedTools, setUsePower }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const SettingsConsumer = SettingsContext.Consumer;

export default SettingsContext;