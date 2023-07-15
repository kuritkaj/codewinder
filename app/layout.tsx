import { Metadata } from "next";
import { ReactNode } from "react";
import "@fontsource-variable/public-sans";
import "../styles/global.css";
import '../scripts/wdyr';

export const metadata: Metadata = {
    title: "Codewinder",
    description: "Your intelligent personal assistant",
    viewport: "width=device-width, initial-scale=1",
    icons: ["favicon.ico"],
}

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={"dark-theme"}>{children}</body>
        </html>
    )
}