import { createContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";

interface Settings {
    availableTools: string[];
    hasServerKey: boolean;
    localKey: string;
    selectedTools: string[];
    usePower: boolean;
}

interface SettingsContextProps extends Settings {
    setLocalKey: (apiKey: string) => void;
    setSelectedTools: (selectedTools: string[]) => void;
    setUsePower: (usePower: boolean) => void;
}

const defaultSettings = {
    availableTools: [],
    hasServerKey: true,
    localKey: "",
    selectedTools: [],
    usePower: false,
    setLocalKey: () => { throw new Error('Method not implemented.') },
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

        fetch('/api/keycheck')
        .then(response => response.json())
        .then(data => {
            setCurrentSettings((state) => ({
                ...state,
                hasServerKey: data.hasOpenAIApiKey,
            }));
        });
    }, []);

    const setLocalKey = (localKey: string) => {
        setCurrentSettings((state) => ({
            ...state,
            localKey,
        }));
    };

    const setSelectedTools = (selectedTools: string[]) => {
        setCurrentSettings((state) => ({
            ...state,
            selectedTools,
        }));
    };

    const setUsePower = async (usePower: boolean) => {
        setCurrentSettings((state) => ({
            ...state,
            usePower,
        }));
        Cookies.set("usePower", JSON.stringify(usePower));
    };

    return (
        <SettingsContext.Provider
            value={{ ...currentSettings, setLocalKey, setSelectedTools, setUsePower }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;