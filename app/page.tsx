import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Stacks from "components/pages/Stacks";
import { cookies } from "next/headers";
import React from "react";

export default async function HomePage() {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data: {session}} = await supabase.auth.getSession();
    const {data: stacks} = await supabase.from("stacks").select();

    return <Stacks session={session} stacks={stacks}/>;
}