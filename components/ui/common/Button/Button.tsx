import React, { ButtonHTMLAttributes, forwardRef, ForwardRefRenderFunction } from "react";
import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const Button: ForwardRefRenderFunction<HTMLButtonElement, ButtonProps> = ({className, children, ...props}: ButtonProps, ref) => {
    return (
        <button ref={ref} className={`${className || ""} ${styles.button}`} {...props}>
            {children}
        </button>
    );
}

export default forwardRef(Button);