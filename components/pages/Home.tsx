import ChatPanel from "@/components/ui/ChatPanel/ChatPanel";
import Footer from "@/components/ui/Footer/Footer";
import Header from "@/components/ui/Header/Header";
import Head from "next/head";
import styles from "./Home.module.css";

const Home = () => {
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
                    {/*<Hidden smDown>*/}
                    {/*    <div className={styles.settingspanel}>*/}
                    {/*        <SettingsPanel tools={[]} onChange={() => {}}/>*/}
                    {/*    </div>*/}
                    {/*</Hidden>*/}
                    <div className={styles.chatpanel}>
                        <ChatPanel/>
                    </div>
                </main>
                <Footer/>
            </div>
        </>
    );
}

export default Home;