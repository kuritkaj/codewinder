import NamespaceContext from "@/components/context/NamespaceContext";
import { useContext } from "react";

export const useNamespace = () => {
    return useContext(NamespaceContext);
};

export default useNamespace;