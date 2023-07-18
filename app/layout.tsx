import "@fontsource-variable/public-sans";
import { Metadata } from "next";
import { ReactNode } from "react";
import '../scripts/wdyr';
import "../styles/global.css";

/** https://sreetamdas.com/blog/the-perfect-dark-mode */
function setInitialColorMode() {
    function getInitialColorMode() {
        const preference = window.localStorage.getItem("light-dark-mode");
        const hasExplicitPreference = Boolean(preference);
        /**
         * If the user has explicitly chosen light or dark,
         * use it. Otherwise, this value will be null.
         */
        if (hasExplicitPreference) {
            return preference;
        }
        // If there is no saved preference, use a media query
        const mediaQuery = "(prefers-color-scheme: dark)";
        const mql = window.matchMedia(mediaQuery);
        const hasImplicitPreference = Boolean(mql);
        if (hasImplicitPreference) {
            return mql.matches ? "dark" : "light";
        }
        // default to 'dark'.
        return "dark";
    }
    const colorMode = getInitialColorMode();
    const root = document.documentElement;
    root.style.setProperty("--initial-color-mode", colorMode);
    // add HTML attribute
    if (colorMode === "dark") document.documentElement.classList.add("dark-theme");
    else document.documentElement.classList.add("light-theme");
}
// our function needs to be a string
const blockingSetInitialColorMode = `(function() {
		${setInitialColorMode.toString()}
		setInitialColorMode();
})()
`;

export const metadata: Metadata = {
    title: "Codewinder",
    description: "Your intelligent personal assistant",
    viewport: "width=device-width, initial-scale=1",
    icons: ["favicon.ico"],
}

function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en">
        <body>
            {children}
            <script
                dangerouslySetInnerHTML={{
                    __html: blockingSetInitialColorMode,
                }}
            ></script>
        </body>
        </html>
    );
}

export default RootLayout;