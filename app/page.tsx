import Button from "@/components/ui/common/Button";
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
    return (
        <div className={styles.fullscreen}>
            <h2>Codewinder</h2>
            <div className={styles.typewriter}><span className={styles.typetext}>A better <s>AI</s> way to get work done</span></div>
            <Link href="/signin" prefetch={false}>
                <Button className={styles.login}><h4>Get started</h4></Button>
            </Link>
        </div>
    );
}