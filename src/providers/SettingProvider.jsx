/* eslint-disable react-refresh/only-export-components */

import { createContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";

const getCookie = (key, alt) => {
    const value = Cookies.get(key);

    if (!value) {
        return alt;
    } else if (value === "true") {
        return true;
    } else if (value === "false") {
        return false;
    }

    return value;
};

const setCookie = (key, value) => {
    Cookies.set(key, value, { expires: 365 * 10, sameSite: "strict" });
};

export const SettingContext = createContext({
    theme: "",
    timeFormat: "",
    newAtTop: false,
    enableTagHelper: false,
    wsKey: "",
    defaultOffset: "-20",
    page: "",
    audioDownloader: false,
    setTheme: () => {},
    setTimeFormat: () => {},
    setNewAtTop: () => {},
    setEnableTagHelper: () => {},
    setWsKey: () => {},
    setDefaultOffset: () => {},
    setPage: () => {},
    setAudioDownloader: () => {},
});

export const SettingProvider = ({ children }) => {
    const [theme, setTheme] = useState(getCookie("theme", "system"));
    const [timeFormat, setTimeFormat] = useState(getCookie("timeFormat", "relative"));
    const [newAtTop, setNewAtTop] = useState(getCookie("newAtTop", true));
    const [enableTagHelper, setEnableTagHelper] = useState(getCookie("enableTagHelper", false));
    const [wsKey, setWsKey] = useState(getCookie("wsKey", "doki"));
    const [defaultOffset, setDefaultOffset] = useState(getCookie("defaultOffset", "-20"));
    const [page, setPage] = useState(getCookie("page", "transcript"));
    const [audioDownloader, setAudioDownloader] = useState(getCookie("audioDownloader", false));

    const settingValue = useMemo(
        () => ({
            theme,
            timeFormat,
            newAtTop,
            enableTagHelper,
            wsKey,
            defaultOffset,
            page,
            audioDownloader,
            setTheme,
            setTimeFormat,
            setNewAtTop,
            setEnableTagHelper,
            setWsKey,
            setDefaultOffset,
            setPage,
            setAudioDownloader,
        }),
        [theme, timeFormat, newAtTop, enableTagHelper, wsKey, defaultOffset, page, audioDownloader],
    );

    // Saves current settings to cookie when any value changes
    useEffect(() => {
        setCookie("theme", theme);
    }, [theme]);
    useEffect(() => {
        setCookie("timeFormat", timeFormat);
    }, [timeFormat]);
    useEffect(() => {
        setCookie("newAtTop", newAtTop);
    }, [newAtTop]);
    useEffect(() => {
        setCookie("enableTagHelper", enableTagHelper);
    }, [enableTagHelper]);
    useEffect(() => {
        setCookie("wsKey", wsKey);
    }, [wsKey]);
    useEffect(() => {
        setCookie("defaultOffset", defaultOffset);
    }, [defaultOffset]);
    useEffect(() => {
        setCookie("page", page);
    }, [page]);
    useEffect(() => {
        setCookie("audioDownloader", audioDownloader);
    }, [audioDownloader]);

    return <SettingContext.Provider value={settingValue}>{children}</SettingContext.Provider>;
};
