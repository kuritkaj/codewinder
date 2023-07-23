import Button from "@/components/ui/common/Button";
import * as Form from "@radix-ui/react-form";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./SignInForm.module.css";

type SignInProps = {
    providers?: Provider[]
    showEmailAuth?: boolean;
}

const SignInForm = ({providers = ["github"], showEmailAuth = false}: SignInProps) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleProviderSignIn = async (provider: Provider) => {
        console.log("handleProviderSignIn", `${window.location.origin}`);
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `https://www.codewinder.com/auth/callback`,
            },
        });
    }

    const handleSignUp = async () => {
        await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
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

    return (
        <div className={styles.root}>
            {providers && (
                <div className={styles.providers}>
                    {providers.map((provider) => (
                        <Button key={provider} className={styles.button} onClick={async () => await handleProviderSignIn(provider)}>
                            Login with&nbsp;<span className={styles.touppercase}>{provider}</span>
                        </Button>
                    ))}
                </div>
            )}

            {showEmailAuth && (
                <Form.Root className={styles.form}>
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

                    <Form.Submit className={styles.formsubmit} asChild onClick={handleSignIn}>
                        <Button className={styles.button}>
                            Login with password
                        </Button>
                    </Form.Submit>

                    <Form.Submit className={styles.formsubmit} asChild onClick={handleSignUp}>
                        <Button className={styles.button}>
                            Sign up with password
                        </Button>
                    </Form.Submit>

                    {/*<Link href="/forgot">Forgot your password?</Link>*/}
                    {/*<Link href="/signup">Don&apos;t have an account? Sign up</Link>*/}
                </Form.Root>
            )}
        </div>
    );
}

export default SignInForm;