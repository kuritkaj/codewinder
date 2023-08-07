import "@fontsource-variable/public-sans";
import { Metadata } from "next";
import { ReactNode } from "react";
import "./global.css";
import "./wdyr";

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
        // default to "light".
        return "light";
    }

    const colorMode = getInitialColorMode();
    // add HTML attribute
    if (colorMode === "dark") {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
    }
}

// our function needs to be a string
const blockingSetInitialColorMode = `(function() {
		${setInitialColorMode.toString()}
		setInitialColorMode();
})();
`;

export const metadata: Metadata = {
    title: "Codewinder",
    description: "Your intelligent personal assistant",
}

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en" style={{background: "#000"}}>
        <body className="light-theme" suppressHydrationWarning>
        {children}
        <script dangerouslySetInnerHTML={{__html: blockingSetInitialColorMode}}/>
        </body>
        </html>
    );
}