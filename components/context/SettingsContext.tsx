import Cookies from "js-cookie";
import { createContext, ReactNode, useEffect, useState } from "react";

interface Settings {
    availableTools: string[];
    selectedTools: string[];
    usePower: boolean;
}

interface SettingsContextProps extends Settings {
    setSelectedTools: (selectedTools: string[]) => void;
    setUsePower: (usePower: boolean) => void;
}

const defaultSettings = {
    availableTools: [],
    selectedTools: [],
    usePower: false,
    setSelectedTools: () => { throw new Error('Method not implemented.') },
    setUsePower: () => { throw new Error('Method not implemented.') },
};

const SettingsContext = createContext<SettingsContextProps>(defaultSettings);

type SettingsProviderProps = {
    children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
    const [currentSettings, setCurrentSettings] = useState<Settings>(
        defaultSettings
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

    return (
        <SettingsContext.Provider
            value={{...currentSettings, setSelectedTools, setUsePower}}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;