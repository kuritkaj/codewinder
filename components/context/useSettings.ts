import SettingsContext from "@/components/context/SettingsContext";
import { useContext } from "react";

const useSettings = () => {
    return useContext(SettingsContext);
};

export default useSettings;