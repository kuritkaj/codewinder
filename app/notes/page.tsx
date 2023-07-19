import Notes from "@/components/pages/Notes";
import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // Workaround for NextJS bug https://github.com/vercel/next.js/issues/49373

export default async function NotesPage() {
    const supabase = createServerComponentClient<Database>({cookies});

    const {data: notes} = await supabase.from("notes").select();

    return <Notes notes={notes}/>;
}