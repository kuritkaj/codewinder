import { logError } from "@/lib/util/logger";
import { SupabaseClient } from "@supabase/supabase-js";
import React, { createContext, ReactNode, useEffect } from "react";

interface CodeEvaluatorContextProps {
    supabase?: SupabaseClient;
}

const defaultEnvironment = {
    supabase: undefined,
}

const CodeEvaluatorContext = createContext<CodeEvaluatorContextProps>(defaultEnvironment);

type NamespaceProviderProps = {
    children: ReactNode;
    supabase: SupabaseClient;
}

export const CodeEvaluatorProvider = ({children, supabase}: NamespaceProviderProps) => {
    useEffect(() => {
        const comms = supabase?.channel("code-evaluator", {
            config: {
                broadcast: {
                    ack: true,
                },
            },
        });

        comms?.on("broadcast", {event: "eval-code"}, async (payload) => {
            console.log(payload);
            await comms.send({
                type: "broadcast",
                event: "eval-result",
                payload: {result: "Code executed successfully!"}
            });
        }).subscribe();

        return () => {
            supabase.removeChannel(comms).catch(error => logError(error));
        }
    }, [supabase]);

    return (
        <CodeEvaluatorContext.Provider value={{supabase}}>
            {children}
        </CodeEvaluatorContext.Provider>
    );
};

export default CodeEvaluatorContext;