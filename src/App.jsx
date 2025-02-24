/* eslint-disable react-hooks/exhaustive-deps */

import { useContext, useEffect, useState } from "react";
import "./App.css";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import { darkTheme, lightTheme } from "./theme";
import { TranscriptContext, TranscriptProvider } from "./providers/TranscriptProvider";
import { Websocket } from "./Websocket";
import { SettingContext } from "./providers/SettingProvider";
import StreamLogs from "./components/StreamLogs";
import { TagOffsetPopupProvider } from "./providers/TagOffsetPopupProvider";
import StreamWordCount from "./components/StreamWordCount";
import Maintenance from "./components/Maintenance";
import Sidebar from "./components/Sidebar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./components/Home";
import TagFixer from "./components/TagFixer";
import LineMenu from "./components/LineMenu";
import { LineMenuProvider } from "./providers/LineMenuProvider";
import { AudioContext, AudioProvider } from "./providers/AudioProvider";

function App() {
    const location = useLocation();
    const [wsKey, setWsKey] = useState(undefined);
    const { theme } = useContext(SettingContext);
    const { setActiveId, setActiveTitle, setStartTime, setIsLive, setTranscript } = useContext(TranscriptContext);
    const { setAudioId } = useContext(AudioContext);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    let colorTheme = prefersDarkMode ? darkTheme : lightTheme;
    if (theme === "light") {
        colorTheme = lightTheme;
    } else if (theme === "dark") {
        colorTheme = darkTheme;
    }

    const keys = ["doki", "mint", "juna"];
    if (import.meta.env.DEV) {
        keys.push("test");
    }

    useEffect(() => {
        let key;
        keys.map((value) => {
            if (location.pathname.split("/").at(1) === value) {
                key = value;
            }
        });

        if (key !== wsKey) {
            setActiveId("");
            setActiveTitle("");
            setStartTime(0);
            setIsLive(false);
            setTranscript([]);
            setAudioId(-1);
        }

        setWsKey(key);
    }, [location]);

    return (
        <TranscriptProvider>
            <ThemeProvider theme={colorTheme}>
                <CssBaseline />
                <TagOffsetPopupProvider>
                    <LineMenuProvider>
                        <AudioProvider>
                            {window.maintenance ? (
                                <Maintenance />
                            ) : (
                                <>
                                    <LineMenu wsKey={wsKey} />
                                    <Sidebar wsKey={wsKey}>
                                        {wsKey ? (
                                            <>
                                                <Websocket wsKey={wsKey} />
                                                <Routes>
                                                    <Route path={`${wsKey}/*`} element={<StreamLogs wsKey={wsKey} />} />
                                                    <Route path={`${wsKey}/graph/`} element={<StreamWordCount />} />
                                                    <Route
                                                        path={`${wsKey}/tagFixer/`}
                                                        element={<TagFixer wsKey={wsKey} />}
                                                    />
                                                </Routes>
                                            </>
                                        ) : (
                                            <Home />
                                        )}
                                    </Sidebar>
                                </>
                            )}
                        </AudioProvider>
                    </LineMenuProvider>
                </TagOffsetPopupProvider>
            </ThemeProvider>
        </TranscriptProvider>
    );
}

export default App;
