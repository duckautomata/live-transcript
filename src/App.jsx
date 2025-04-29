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
import { LineMenuProvider } from "./providers/LineMenuProvider";
import { AudioContext, AudioProvider } from "./providers/AudioProvider";
import { ClipperPopupProvider } from "./providers/ClipperPopupProvider";
import ClipperPopup from "./components/ClipperPopup";
import { keys } from "./config";

function App() {
    const location = useLocation();
    const [wsKey, setWsKey] = useState(undefined);
    const { theme } = useContext(SettingContext);
    const { setActiveId, setActiveTitle, setStartTime, setMediaType, setIsLive, setTranscript } = useContext(TranscriptContext);
    const { setAudioId } = useContext(AudioContext);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    let colorTheme = prefersDarkMode ? darkTheme : lightTheme;
    if (theme === "light") {
        colorTheme = lightTheme;
    } else if (theme === "dark") {
        colorTheme = darkTheme;
    }

    useEffect(() => {
        let key;
        keys().map((value) => {
            if (location.pathname.split("/").at(1) === value) {
                key = value;
            }
        });

        if (key !== wsKey) {
            setActiveId("");
            setActiveTitle("");
            setStartTime(0);
            setMediaType("none")
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
                    <ClipperPopupProvider>
                        <LineMenuProvider>
                            <AudioProvider>
                                {window.maintenance ? (
                                    <Maintenance />
                                ) : (
                                    <>
                                        <ClipperPopup wsKey={wsKey} />
                                        <Sidebar wsKey={wsKey}>
                                            {wsKey ? (
                                                <>
                                                    <Websocket wsKey={wsKey} />
                                                    <Routes>
                                                        <Route
                                                            path={`${wsKey}/*`}
                                                            element={<StreamLogs wsKey={wsKey} />}
                                                        />
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
                    </ClipperPopupProvider>
                </TagOffsetPopupProvider>
            </ThemeProvider>
        </TranscriptProvider>
    );
}

export default App;
