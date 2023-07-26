import type { Database } from "@/lib/types/Database";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({req, res});
    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    await supabase.auth.getSession();
    return res;
}

export default middleware;