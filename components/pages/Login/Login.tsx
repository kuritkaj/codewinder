"use client";

import BaseButton from "@/components/ui/BaseButton";
import { Database } from "@/lib/types/Database";
import * as Form from '@radix-ui/react-form';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Login.module.css";

const Login = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter();
    const supabase = createClientComponentClient<Database>();

    const handleSignUp = async () => {
        await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });
        router.refresh();
    }

    const handleSignIn = async () => {
        await supabase.auth.signInWithPassword({
            email,
            password,
        });
        router.refresh();
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    }

    return (
        <div className={styles.center}>
            <div className={styles.navlogo}>
                <Link href="/">Codewinder</Link>
            </div>
            <Form.Root className={styles.formroot}>
                <Form.Field className={styles.formfield} name="email">
                    <Form.Label className={styles.formlabel}>
                        Email address
                    </Form.Label>
                    <Form.Message className={styles.formmessage} match="valueMissing">
                        Please enter your email
                    </Form.Message>
                    <Form.Message className={styles.formmessage} match="typeMismatch">
                        Please provide a valid email
                    </Form.Message>
                    <Form.Control asChild>
                        <input className={styles.input} type="email" required
                               onChange={(event) => setEmail(event.target.value)}
                        />
                    </Form.Control>
                </Form.Field>

                <Form.Field className={styles.formfield} name="password" aria-valuemin={8}>
                    <Form.Label className={styles.formlabel}>
                        Password
                    </Form.Label>
                    <Form.Message className={styles.formmessage} match="valueMissing">
                        Please enter your password
                    </Form.Message>
                    <Form.Message className={styles.formmessage} match="tooShort">
                        Please provide a password of at least 8 characters
                    </Form.Message>
                    <Form.Control asChild>
                        <input className={styles.input} type="password" minLength={8} required
                               onChange={(event) => setPassword(event.target.value)}
                        />
                    </Form.Control>
                </Form.Field>

                <Form.Submit className={styles.formsubmit} asChild onSubmit={handleSignIn}>
                    <BaseButton className={styles.button}>
                        Login
                    </BaseButton>
                </Form.Submit>
            </Form.Root>
        </div>
    )
}

export default Login;