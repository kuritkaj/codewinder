"use server";

import { cookies } from "next/headers";

export async function getUsePowerSetting(): Promise<boolean> {
    return JSON.parse(cookies().get("usePower")?.value || "false");
}

export async function setUsePowerSetting(usePower: boolean) {
    cookies().set("usePower", JSON.stringify(usePower));
}