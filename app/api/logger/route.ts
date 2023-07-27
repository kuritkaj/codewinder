import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    console.log("Logger: ", await request.json());
    return NextResponse.json({logged: true});
}