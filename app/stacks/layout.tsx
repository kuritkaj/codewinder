import Header from "@/components/ui/Header";
import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";
import styles from "./layout.module.css";

export const dynamic = "force-dynamic"; // Workaround for NextJS bug https://github.com/vercel/next.js/issues/49373

export default async function StackLayout({children}: { children: ReactNode }) {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data: {session}} = await supabase.auth.getSession();

    return (
        <div className={styles.fullscreen}>
            <Header user={session?.user}/>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}