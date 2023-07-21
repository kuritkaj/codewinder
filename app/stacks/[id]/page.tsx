import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Stack from "components/pages/Stack";
import { cookies } from "next/headers";

type StackPageProps = {
    params: {
        id: string;
    }
}

export default async function StackPage({params: {id}}: StackPageProps) {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data: {session}} = await supabase.auth.getSession();

    const {data: stack, error: stackError} = await supabase.from("stacks").select().eq("id", id).maybeSingle();
    const {data: stacks, error: stacksError} = await supabase.from("stacks").select();
    const {data: notebooks, error: notebooksError} = await supabase.from("notebooks").select().eq("stack_id", id);

    return <Stack notebooks={notebooks} session={session} stack={stack} stacks={stacks}/>;
}