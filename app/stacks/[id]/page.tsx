import Stack from "components/pages/Stack";
import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// export const dynamic = "force-dynamic"; // Workaround for NextJS bug https://github.com/vercel/next.js/issues/49373

export default async function StackPage() {
    const supabase = createServerComponentClient<Database>({cookies});

    const {data: notebooks} = await supabase.from("notebooks").select();

    return <Stack notebooks={notebooks}/>;
}