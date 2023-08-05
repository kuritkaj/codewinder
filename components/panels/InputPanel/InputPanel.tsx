import useNotebook from "@/components/context/useNotebook";
import InputTextArea from "@/components/ui/InputTextArea";
import { useState } from "react";
import styles from "./InputPanel.module.css";

type InputPanelProps = {
    defaultInput?: string;
}

const InputPanel = ({defaultInput = ""}: InputPanelProps) => {
    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState(defaultInput);
    const {generateBlock} = useNotebook();

    const handleSubmit = async (input: string) => {
        const objective = input.trim();
        if (objective === "") {
            return;
        }

        setUserInput("");
        setLoading(true);

        const onClose = () => {
            setLoading(false);
        }

        await generateBlock(objective, null, onClose);
    }

    return (
        <div className={styles.panel}>
            <InputTextArea
                userInput={userInput}
                setUserInput={setUserInput}
                handleSubmit={async () => {
                    await handleSubmit(userInput)
                }}
                loading={loading}
            />
        </div>
    );
};

export default InputPanel;