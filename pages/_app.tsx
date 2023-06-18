import '../styles/globals.css'
import { CssBaseline, CssVarsProvider, GlobalStyles } from "@mui/joy";
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CssVarsProvider defaultMode="system">
      <CssBaseline /> {/* CssBaseline must come first */}
      <GlobalStyles
          styles={{
            root: {
                boxSizing: "border-box",
            },
            html: {
              maxWidth: "100vw",
              overflowX: "hidden",
            },
            body: {
              maxWidth: "100vw",
              overflowX: "hidden",
            },
          }}
      />
      <Component {...pageProps} />
    </CssVarsProvider>
  );
}
