import React from "react";
import styles from "./Card.module.css";

type CardProps = React.ButtonHTMLAttributes<HTMLDivElement>;

const Card = ({children, className, title, ...props}: CardProps) => {
    return (
        <div className={`${className || ""} ${styles.card}`} {...props}>
            <div className={styles.cardheader}>
                {title}
            </div>
            <div className={styles.cardcontent}>
                {children}
            </div>
        </div>
    );
}

export default Card;