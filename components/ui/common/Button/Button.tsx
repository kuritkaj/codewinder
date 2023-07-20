import React, { forwardRef } from "react";
import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({className, children, ...props}: ButtonProps, ref) => {
    return (
        <button ref={ref} className={`${className || ""} ${styles.button}`} {...props}>
            {children}
        </button>
    );
}

export default forwardRef(Button);