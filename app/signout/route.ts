import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = "force-dynamic"; // Workaround for NextJS bug https://github.com/vercel/next.js/issues/49373

export async function GET(req: NextRequest) {
    const SITE_URL = process.env.SITE_URL;
    const supabase = createRouteHandlerClient({ cookies });

    // Check if we have a session
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (session) {
        await supabase.auth.signOut()
    }

    return NextResponse.redirect(new URL('/', SITE_URL || req.url), {
        status: 302,
    });
}