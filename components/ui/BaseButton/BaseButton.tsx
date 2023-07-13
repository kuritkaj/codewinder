import React from "react";
import styles from "./BaseButton.module.css";

const BaseButton = ({ className, children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    return (
        <button className={`${className} ${styles.button}`} onClick={onClick} {...props}>
            {children}
        </button>
    );
};

export default BaseButton;
