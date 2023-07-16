"use client";

import { Database } from "@/lib/types/Database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import styles from "./Login.module.css";

const Login = () => {
    const supabase = createClientComponentClient<Database>();

    return (
        <div className={styles.center}>
            <div className={styles.navlogo}>
                <Link href="/">Codewinder</Link>
            </div>
            <Auth
                supabaseClient={supabase}
                appearance={{theme: ThemeSupa}}
                theme="dark"
            />
        </div>
    )
}

export default Login;