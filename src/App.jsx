import { useContext } from "react";
import "./App.css";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import { darkTheme, lightTheme } from "./theme";
import { TranscriptProvider } from "./providers/TranscriptProvider";
import { Websocket } from "./Websocket";
import { SettingContext } from "./providers/SettingProvider";
import StreamLogs from "./components/StreamLogs";
import Header from "./components/Header";
import { TagOffsetPopupProvider } from "./providers/TagOffsetPopupProvider";
import StreamWordCount from "./components/StreamWordCount";
import Maintenance from "./components/Maintenance";
import Footer from "./components/Footer";

function App() {
    const { theme, page } = useContext(SettingContext);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    let colorTheme = prefersDarkMode ? darkTheme : lightTheme;
    if (theme === "light") {
        colorTheme = lightTheme;
    } else if (theme === "dark") {
        colorTheme = darkTheme;
    }

    return (
        <TranscriptProvider>
            <ThemeProvider theme={colorTheme}>
                <CssBaseline />
                <TagOffsetPopupProvider>
                    {window.maintenance ? (
                        <Maintenance />
                    ) : (
                        <>
                            <Websocket />
                            <Header />
                            <div style={{ marginTop: 40 }} />
                            {page === "transcript" && <StreamLogs />}
                            {page === "wordCount" && <StreamWordCount />}
                            <div style={{ marginTop: 40 }} />
                            <Footer />
                        </>
                    )}
                </TagOffsetPopupProvider>
            </ThemeProvider>
        </TranscriptProvider>
    );
}

export default App;
