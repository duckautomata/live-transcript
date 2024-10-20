import { createContext, useEffect, useMemo, useState } from "react";
import cookie from "cookiejs";

const getCookie = (key, alt) => {
    const value = cookie.get(key);

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
    cookie.set(key, value);
};

export const SettingContext = createContext({
    theme: "",
    newAtTop: false,
    enableTagHelper: false,
    wsKey: "",
    defaultOffset: "-20",
    setTheme: () => {},
    setNewAtTop: () => {},
    setEnableTagHelper: () => {},
    setWsKey: () => {},
    setDefaultOffset: () => {},
});

export const SettingProvider = ({children}) => {
    const [theme, setTheme] = useState(getCookie("theme", "system"));
    const [newAtTop, setNewAtTop] = useState(getCookie("newAtTop", true));
    const [enableTagHelper, setEnableTagHelper] = useState(getCookie("enableTagHelper", false));
    const [wsKey, setWsKey] = useState(getCookie("wsKey", "doki"));
    const [defaultOffset, setDefaultOffset] = useState(getCookie("defaultOffset", "-20"));


    const settingValue = useMemo(() => ({ theme, newAtTop, enableTagHelper, wsKey, defaultOffset, setTheme, setNewAtTop, setEnableTagHelper, setWsKey, setDefaultOffset }), [theme, newAtTop, enableTagHelper, wsKey, defaultOffset]);
    
    // Saves current settings to cookie when any value changes
    useEffect(() => {
        setCookie("theme", theme)
    }, [theme]);
    useEffect(() => {
        setCookie("newAtTop", newAtTop)
    }, [newAtTop]);
    useEffect(() => {
        setCookie("enableTagHelper", enableTagHelper)
    }, [enableTagHelper]);
    useEffect(() => {
        setCookie("wsKey", wsKey)
    }, [wsKey]);
    useEffect(() => {
        setCookie("defaultOffset", defaultOffset)
    }, [defaultOffset]);

    return (
        <SettingContext.Provider value={settingValue}>
            {children}
        </SettingContext.Provider>
    )
}