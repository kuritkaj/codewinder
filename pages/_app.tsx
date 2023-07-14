import "@fontsource-variable/public-sans";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import '../scripts/wdyr';

export default function App({Component, pageProps}: AppProps) {
    return (
        <Component {...pageProps} />
    );
}
