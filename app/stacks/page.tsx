import Stacks from "@/components/pages/Stacks";
import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

export default async function StacksPage() {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data: {session}} = await supabase.auth.getSession();

    if (!session) {
        // this is a protected route - only users who are signed in can view this route
        redirect("/");
    }

    const stacks = await supabase.from("stacks").select().order("created_at", {ascending: true});

    return <Stacks stacks={stacks.data}/>;
}