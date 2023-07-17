import "@fontsource-variable/public-sans";
import { Metadata } from "next";
import { ReactNode } from "react";
import '../scripts/wdyr';
import "../styles/global.css";

export const metadata: Metadata = {
    title: "Codewinder",
    description: "Your intelligent personal assistant",
    viewport: "width=device-width, initial-scale=1",
    icons: ["favicon.ico"],
}

function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en">
        <body className={"dark-theme"}>{children}</body>
        </html>
    );
}

export default RootLayout;