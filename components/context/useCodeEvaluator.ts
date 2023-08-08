import CodeEvaluatorContext from "@/components/context/CodeEvaluatorContext";
import { useContext } from "react";

const useCodeEvaluator = () => {
    return useContext(CodeEvaluatorContext);
};

export default useCodeEvaluator;