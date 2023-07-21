import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import SignIn from "components/pages/SignIn";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignInPage() {
    const supabase = createServerComponentClient<Database>({cookies});
    const {data: {session}} = await supabase.auth.getSession();

    if (session) {
        // user already authenticated
        redirect("/stacks");
    }

    return (
        <SignIn/>
    );
}