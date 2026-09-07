import "./App.css";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { darkTheme, lightTheme } from "./theme";
import { Websocket } from "./Websocket";
import Sidebar from "./components/Sidebar";
import ClipperPopup from "./components/ClipperPopup";
import { keys, streamerName } from "./config";
import { useAppStore } from "./store/store";
import TagOffsetPopup from "./components/TagOffsetPopup";
import UpdateAlert from "./components/UpdateAlert";
import Maintenance from "./pages/single/Maintenance";
import TagFormatter from "./pages/tagformatter/TagFormatter";
import View from "./pages/transcript/View";
import StreamWordCount from "./pages/graph/StreamWordCount";
import CensorPage from "./pages/single/CensorPage";
import Home from "./pages/single/Home";
import Tracker from "./pages/single/Tracker";
import { useTagIntegration } from "./hooks/useTagIntegration";
import EnvironmentBadge from "./components/EnvironmentBadge";
import SettingsPopup from "./components/SettingsPopup";
import HelpPopup from "./components/HelpPopup";
import InfoPopup from "./components/InfoPopup";
import DevToolsPopup from "./components/DevToolsPopup";
import DeletedStreamSnackbar from "./components/DeletedStreamSnackbar";
import ToastSnackbar from "./components/ToastSnackbar";
import { usePageTitle } from "./logic/usePageTitle";
import { currentPage } from "./logic/links";

/** Tab title suffix per page segment; the transcript view itself has none. */
const PAGE_LABELS = {
    graph: "Graph",
    track: "Tracker",
    tagFixer: "Tag Formatter",
};

/**
 * Browser tab title for the current route ("Doki", "Doki Graph", "Censor", or "" for home).
 * @param {string | undefined} wsKey
 * @param {string} pathname
 * @returns {string}
 */
function pageTitle(wsKey, pathname) {
    if (wsKey) {
        const label = PAGE_LABELS[currentPage(pathname)];
        return label ? `${streamerName(wsKey)} ${label}` : streamerName(wsKey);
    }
    if (pathname.startsWith("/censor")) return "Censor";
    if (pathname.startsWith("/tagFixer")) return PAGE_LABELS.tagFixer;
    return "";
}

/**
 * The root application component.
 * Manages theme, routing, and WebSocket key state based on the current url.
 */
function App() {
    const location = useLocation();
    const theme = useAppStore((state) => state.theme);
    const devMode = useAppStore((state) => state.devMode);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    let colorTheme = prefersDarkMode ? darkTheme : lightTheme;
    if (theme === "light") {
        colorTheme = lightTheme;
    } else if (theme === "dark") {
        colorTheme = darkTheme;
    }

    const pathSegment = location.pathname.split("/")[1];
    const wsKey = keys(devMode).find((k) => k === pathSegment);

    useTagIntegration(wsKey);
    usePageTitle(pageTitle(wsKey, location.pathname));

    return (
        <ThemeProvider theme={colorTheme}>
            {/* enableColorScheme makes native controls (scrollbars, inputs) follow the chosen theme */}
            <CssBaseline enableColorScheme />
            <EnvironmentBadge />
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
                                    {/* Keyed so search, tab and jump state never leak from one streamer to the next. */}
                                    <Route path={`${wsKey}/*`} element={<View key={wsKey} wsKey={wsKey} />} />
                                    <Route path={`${wsKey}/graph/`} element={<StreamWordCount />} />
                                    <Route path={`${wsKey}/track/`} element={<Tracker wsKey={wsKey} />} />
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
            <SettingsPopup />
            <HelpPopup />
            <InfoPopup />
            <DevToolsPopup />
            <DeletedStreamSnackbar />
            <ToastSnackbar />
        </ThemeProvider>
    );
}

export default App;
