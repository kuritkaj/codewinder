import styles from "./Card.module.css";

const Card = ({ children, className, ...rest }: CardProps) => {
    return (
        <div className={`${className || ""} ${styles.card}`} {...rest}>
            <div className={styles.cardHeader}>
                {title}
            </div>
            {children}
        </div>
    );
}

export default Card;