import SettingsContext from "@/components/context/SettingsContext";
import { useContext } from "react";

export const useSettings = () => {
    return useContext(SettingsContext);
};

export default useSettings;