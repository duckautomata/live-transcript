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
    density: "",
    timeFormat: "",
    newAtTop: false,
    enableTagHelper: false,
    defaultOffset: "-20",
    sidebarOpen: true,
    setTheme: () => {},
    setDensity: () => {},
    setTimeFormat: () => {},
    setNewAtTop: () => {},
    setEnableTagHelper: () => {},
    setDefaultOffset: () => {},
    setSidebarOpen: () => {},
});

export const SettingProvider = ({ children }) => {
    const [theme, setTheme] = useState(getCookie("theme", "system"));
    const [density, setDensity] = useState(getCookie("density", "standard"));
    const [timeFormat, setTimeFormat] = useState(getCookie("timeFormat", "relative"));
    const [newAtTop, setNewAtTop] = useState(getCookie("newAtTop", true));
    const [enableTagHelper, setEnableTagHelper] = useState(getCookie("enableTagHelper", false));
    const [defaultOffset, setDefaultOffset] = useState(getCookie("defaultOffset", "-20"));
    const [sidebarOpen, setSidebarOpen] = useState(getCookie("sidebarOpen", false));

    const settingValue = useMemo(
        () => ({
            theme,
            density,
            timeFormat,
            newAtTop,
            enableTagHelper,
            defaultOffset,
            sidebarOpen,
            setTheme,
            setDensity,
            setTimeFormat,
            setNewAtTop,
            setEnableTagHelper,
            setDefaultOffset,
            setSidebarOpen,
        }),
        [theme, density, timeFormat, newAtTop, enableTagHelper, defaultOffset, sidebarOpen],
    );

    // Saves current settings to cookie when any value changes
    useEffect(() => {
        setCookie("theme", theme);
    }, [theme]);
    useEffect(() => {
        setCookie("density", density);
    }, [density]);
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
        setCookie("defaultOffset", defaultOffset);
    }, [defaultOffset]);
    useEffect(() => {
        setCookie("sidebarOpen", sidebarOpen);
    }, [sidebarOpen]);

    return <SettingContext.Provider value={settingValue}>{children}</SettingContext.Provider>;
};
