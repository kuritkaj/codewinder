"use client";

import LoginForm from "@/components/ui/LoginForm";
import Link from "next/link";
import styles from "./Login.module.css";

const Login = () => {

    return (
        <div className={styles.center}>
            <div className={styles.navlogo}>
                <Link href="/">Codewinder</Link>
            </div>
            <LoginForm/>
        </div>
    )
}

export default Login;