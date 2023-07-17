import UserContext from "@/components/context/UserContext";
import { useContext } from "react";

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error(`useUser must be used within a UserContextProvider.`)
    }
    return context;
}