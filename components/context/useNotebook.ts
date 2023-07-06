import NotebookContext from "@/components/context/NotebookContext";
import { useContext } from "react";

export const useNotebook = () => {
    return useContext(NotebookContext);
};

export default useNotebook;