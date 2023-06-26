import { SettingsProvider } from "@/components/context/SettingsContext";
import useSettings from "@/components/context/useSettings";
import ChatPanel from "@/components/ui/ChatPanel/ChatPanel";
import Footer from "@/components/ui/Footer/Footer";
import Header from "@/components/ui/Header/Header";
import SettingsPanel from "@/components/ui/SettingsPanel";
import Head from "next/head";
import styles from "./Home.module.css";

const Home = () => {
    const settings = useSettings();

    return (
        <>
            <Head>
                <title>Codewinder</title>
                <meta name="description" content="Your intelligent personal assistant"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <div className={styles.fullscreen}>
                <Header/>
                <main className={styles.main}>
                    <SettingsProvider settings={settings}>
                        <div className={styles.chatpanel}>
                            <ChatPanel/>
                        </div>
                        <div className={styles.settingspanel}>
                            <SettingsPanel/>
                        </div>
                    </SettingsProvider>
                </main>
                <Footer/>
            </div>
        </>
    );
}

export default Home;