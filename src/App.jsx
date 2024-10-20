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

function App() {
    const { theme } = useContext(SettingContext);
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
                    <Websocket />
                    <Header />
                    <div style={{ marginTop: 40 }} />
                    <StreamLogs />
                </TagOffsetPopupProvider>
            </ThemeProvider>
        </TranscriptProvider>
    );
}

export default App;
