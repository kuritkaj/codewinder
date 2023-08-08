import { makeChain } from "@/lib/intelligence/makeChain";
import { Database } from "@/lib/types/Database";
import { LangchainStream } from "@/lib/util/LangchainStream";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { StreamingTextResponse } from "ai";
import { OpenAIModerationChain } from "langchain/chains";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

type ServiceOptions = {
    context?: [string, string][];
    objective: string;
    usePower?: boolean;
}

export async function POST(request: NextRequest) {
    // context should be an array of "[message, type]" pairs, where type is "apimessage" or "usermessage"
    const {context, objective, usePower}: ServiceOptions = await request.json();
    const supabase = createRouteHandlerClient<Database>({cookies});

    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!Boolean(openAiApiKey)) {
        throw new Error("OpenAI API Key not set.");
    }

    const {stream, handlers} = LangchainStream();
    try {
        const moderation = new OpenAIModerationChain({
            openAIApiKey: openAiApiKey,
            // If set to true, the call will throw an error when the moderation chain detects violating content.
            // If set to false, violating content will return "Text was found that violates OpenAI's content policy."
            throwError: true,
            verbose: true,
        });
        await moderation.run(objective);

        const chain = await makeChain({
            callbacks: [handlers],
            supabase,
            usePower
        });

        handlers.sendData("Thinking...").then();
        handlers.sendLine().then();
        chain.predict({
            objective,
            context
        }).then(async (completion: string) => {
            await handlers.sendClear();
            await handlers.sendData(completion);
            await handlers.closeStream();
        }).catch(async (error) => {
            await handlers.sendClear();
            await handlers.sendError(error);
            await handlers.closeStream();
        }).finally(async () => {
            await supabase.removeAllChannels();
        });

        // Respond with the stream
        return new StreamingTextResponse(stream);
    } catch (error: any) {
        await handlers.sendClear();
        await handlers.sendError(error);
        await handlers.closeStream();
    }
}