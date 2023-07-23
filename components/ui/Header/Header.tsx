"use client";

import { User } from "@supabase/supabase-js";
import Link from "next/link";
import styles from "./Header.module.css";

type HeaderProps = {
    user?: User;
}

const Header = ({user}: HeaderProps) => {
    return (
        <div className={styles.topnav}>
            <div className={styles.navlogo}/>
            <div className={styles.navlinks}>
                {user ? (
                    <Link href="#" prefetch={false}>
                        Sign out
                    </Link>
                ) : (
                    <Link href="/signin">
                        Sign in
                    </Link>
                )}
            </div>
        </div>
    );
}

export default Header;