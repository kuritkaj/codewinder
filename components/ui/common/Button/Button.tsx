import React, { forwardRef } from "react";
import styles from "./Button.module.css";

type BaseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({className, children, onClick, ...props}: BaseButtonProps, ref) => {
    return (
        <button ref={ref} className={`${className || ""} ${styles.button}`} onClick={onClick} {...props}>
            {children}
        </button>
    );
}

export default forwardRef(Button);