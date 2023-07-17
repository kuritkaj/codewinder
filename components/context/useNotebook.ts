import NotebookContext from "@/components/context/NotebookContext";
import { useContext } from "react";

const useNotebook = () => {
    return useContext(NotebookContext);
};

export default useNotebook;