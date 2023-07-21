import Button from "@/components/ui/common/Button";
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
    return (
        <div className={styles.fullscreen}>
            <Link href="/signin" prefetch={false}>
                <Button className={styles.login}><h2>Login</h2></Button>
            </Link>
        </div>
    );
}