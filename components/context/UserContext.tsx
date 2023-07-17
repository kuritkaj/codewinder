/**
 MIT License

 Copyright (c) 2021 Supabase

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { createContext, useEffect, useState } from "react";

export interface AuthSession {
    user: User | null
    session: Session | null
}

const UserContext = createContext<AuthSession>({user: null, session: null})

export interface Props {
    supabaseClient: SupabaseClient

    [propName: string]: any
}

export const UserContextProvider = (props: Props) => {
    const {supabaseClient} = props
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(session?.user ?? null)

    useEffect(() => {
        ;(async () => {
            const {data} = await supabaseClient.auth.getSession()
            setSession(data.session)
            setUser(data.session?.user ?? null)
        })()

        const {data: authListener} = supabaseClient.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
            }
        )

        return () => {
            authListener?.subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const value = {
        session,
        user,
    }
    return <UserContext.Provider value={value} {...props} />
}

export default UserContext;