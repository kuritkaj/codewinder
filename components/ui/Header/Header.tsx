import { useUser } from "@/components/context/useUser";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

const Header = () => {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const {user} = useUser();

    const signout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    }

    return (
        <div className={styles.topnav}>
            <div className={styles.navlogo}>
                <Link href="/">Codewinder</Link>
            </div>
            <div className={styles.navlinks}>
                {user ? (
                    <Link href="" onClick={signout}>
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