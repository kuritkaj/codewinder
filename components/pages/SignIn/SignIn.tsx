"use client";

import SignInForm from "components/ui/SignInForm";
import Link from "next/link";
import styles from "./SignIn.module.css";

const SignIn = () => {
    return (
        <div className={styles.center}>
            <div className={styles.navlogo}>
                <Link href="/">Codewinder</Link>
            </div>
            <SignInForm/>
        </div>
    )
}

export default SignIn;