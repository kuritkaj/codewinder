import { Database } from "@/lib/types/Database";
import { isValidUuid } from "@/lib/util/isValidUuid";
import { logError } from "@/lib/util/logger";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Stack from "components/pages/Stack";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type StackPageProps = {
    params: {
        id: string;
    }
}

export default async function StackPage({params: {id}}: StackPageProps) {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data: {session}} = await supabase.auth.getSession();

    if (!session) {
        // this is a protected route - only users who are signed in can view this route
        redirect("/");
    }

    if (!id || !isValidUuid(id)) {
        // Handle the case where 'id' is not valid
        logError("Invalid 'id' parameter", {id});
        redirect("/stacks");
    }

    const [stack, stacks, notebooks] = await Promise.all([
        supabase.from("stacks").select().eq("id", id).maybeSingle(),
        supabase.from("stacks").select().order("created_at", {ascending: true}),
        supabase.from("notebooks").select().eq("stack_id", id).order("created_at", {ascending: true}),
    ]);

    return <Stack notebooks={notebooks.data} stack={stack.data} stacks={stacks.data}/>;
}