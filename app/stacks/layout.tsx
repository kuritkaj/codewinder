import Header from "@/components/ui/Header";
import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";
import styles from "./Layout.module.css";

export default async function StackLayout({children}: { children: ReactNode }) {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data} = await supabase.auth.getSession();

    return (
        <div className={styles.fullscreen}>
            <Header user={data.session?.user}/>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}