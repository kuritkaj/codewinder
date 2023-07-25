import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    console.log("Logger: ", request.json());
    return new Response("OK", {status: 204});
}