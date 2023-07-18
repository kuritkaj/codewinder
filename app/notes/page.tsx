import { Database } from "@/lib/types/Database";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function NotesPage() {
    const supabase = createServerComponentClient<Database>({ cookies });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        // this is a protected route - only users who are signed in can view this route
        redirect('/');
    }

    const { data: notes } = await supabase.from("notes").select();

    return (
        <ul className="notes">
            {notes?.map((note) => (
                <li key={note.id}>{note.name}</li>
            ))}
        </ul>
    );
}

export default NotesPage;