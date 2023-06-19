import styles from "./Footer.module.css";
import Link from "next/link";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <p> Powered by <Link href="https://github.com/hwchase17/langchain" target="_blank" rel="noreferrer"> LangChain</Link>.</p>
        </footer>
    );
}

export default Footer;