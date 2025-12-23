/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import "./App.css";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import { darkTheme, lightTheme } from "./theme";
import { Websocket } from "./Websocket";
import View from "./components/View";
import StreamWordCount from "./components/StreamWordCount";
import Maintenance from "./components/Maintenance";
import Sidebar from "./components/Sidebar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./components/Home";
import TagFixer from "./components/TagFixer";
import ClipperPopup from "./components/ClipperPopup";
import { keys } from "./config";
import { useAppStore } from "./store/store";
import TagOffsetPopup from "./components/TagOffsetPopup";

/**
 * The root application component.
 * Manages theme, routing, and WebSocket key state based on the current url.
 */
function App() {
    const location = useLocation();
    const [wsKey, setWsKey] = useState(undefined);
    const theme = useAppStore((state) => state.theme);
    const resetTranscript = useAppStore((state) => state.resetTranscript);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setServerStatus = useAppStore((state) => state.setServerStatus);
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
            resetTranscript();
            setServerStatus("connecting");
            setAudioId(-1);
        }

        setWsKey(key);
    }, [location]);

    return (
        <ThemeProvider theme={colorTheme}>
            <CssBaseline />
            {window.maintenance ? (
                <Routes>
                    <Route path={`*`} element={<Maintenance />} />
                    <Route path={`tagFixer/`} element={<TagFixer wsKey={undefined} />} />
                </Routes>
            ) : (
                <>
                    <ClipperPopup wsKey={wsKey} />
                    <TagOffsetPopup />
                    <Sidebar wsKey={wsKey}>
                        {wsKey ? (
                            <>
                                <Websocket wsKey={wsKey} />
                                <Routes>
                                    <Route path={`${wsKey}/*`} element={<View wsKey={wsKey} />} />
                                    <Route path={`${wsKey}/graph/`} element={<StreamWordCount />} />
                                    <Route path={`${wsKey}/tagFixer/`} element={<TagFixer wsKey={wsKey} />} />
                                </Routes>
                            </>
                        ) : (
                            <Home />
                        )}
                    </Sidebar>
                </>
            )}
        </ThemeProvider>
    );
}

export default App;
