import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Stack from "components/pages/Stack";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // Workaround for NextJS bug https://github.com/vercel/next.js/issues/49373

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

    const [stack, stacks, notebooks] = await Promise.all([
        supabase.from("stacks").select().eq("id", id).maybeSingle(),
        supabase.from("stacks").select(),
        supabase.from("notebooks").select().eq("stack_id", id).order("created_at", {ascending: true}),
    ]);

    return <Stack notebooks={notebooks.data} stack={stack.data} stacks={stacks.data}/>;
}