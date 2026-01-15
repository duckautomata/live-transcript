import "./App.css";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { darkTheme, lightTheme } from "./theme";
import { Websocket } from "./Websocket";
import Sidebar from "./components/Sidebar";
import ClipperPopup from "./components/ClipperPopup";
import { keys } from "./config";
import { useAppStore } from "./store/store";
import TagOffsetPopup from "./components/TagOffsetPopup";
import UpdateAlert from "./components/UpdateAlert";
import Maintenance from "./pages/single/Maintenance";
import TagFormatter from "./pages/tagformatter/TagFormatter";
import View from "./pages/transcript/View";
import StreamWordCount from "./pages/graph/StreamWordCount";
import CensorPage from "./pages/single/CensorPage";
import Home from "./pages/single/Home";
import { useTagIntegration } from "./hooks/useTagIntegration";

/**
 * The root application component.
 * Manages theme, routing, and WebSocket key state based on the current url.
 */
function App() {
    const location = useLocation();
    const theme = useAppStore((state) => state.theme);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    let colorTheme = prefersDarkMode ? darkTheme : lightTheme;
    if (theme === "light") {
        colorTheme = lightTheme;
    } else if (theme === "dark") {
        colorTheme = darkTheme;
    }
    const pathSegment = location.pathname.split("/")[1];
    const wsKey = keys().find((k) => k === pathSegment);

    useTagIntegration(wsKey);

    return (
        <ThemeProvider theme={colorTheme}>
            <CssBaseline />
            <UpdateAlert />
            {window.maintenance ? (
                <Routes>
                    <Route path={`*`} element={<Maintenance />} />
                    <Route path={`tagFixer/`} element={<TagFormatter wsKey={undefined} />} />
                </Routes>
            ) : (
                <>
                    <ClipperPopup wsKey={wsKey} />
                    <TagOffsetPopup wsKey={wsKey} />
                    <Sidebar wsKey={wsKey}>
                        {wsKey ? (
                            <>
                                <Websocket wsKey={wsKey} />
                                <Routes>
                                    <Route path={`${wsKey}/*`} element={<View wsKey={wsKey} />} />
                                    <Route path={`${wsKey}/graph/`} element={<StreamWordCount />} />
                                    <Route path={`${wsKey}/tagFixer/`} element={<TagFormatter wsKey={wsKey} />} />
                                </Routes>
                            </>
                        ) : (
                            <Routes>
                                <Route path="/censor" element={<CensorPage />} />
                                <Route path="*" element={<Home />} />
                            </Routes>
                        )}
                    </Sidebar>
                </>
            )}
        </ThemeProvider>
    );
}

export default App;
