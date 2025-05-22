/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";
import TagOffsetPopup from "../components/TagOffsetPopup";

export const TagOffsetPopupContext = createContext({
    open: false,
    timestamp: 0,
    text: "",
    setOpen: () => {},
    setTimestamp: () => {},
    setText: () => {},
});

export const TagOffsetPopupProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [timestamp, setTimestamp] = useState(0);
    const [text, setText] = useState(0);
    const popupValue = useMemo(
        () => ({ open, timestamp, text, setOpen, setTimestamp, setText }),
        [open, timestamp, text],
    );

    return (
        <TagOffsetPopupContext.Provider value={popupValue}>
            <TagOffsetPopup open={open} setOpen={setOpen} timestamp={timestamp} text={text} />
            {children}
        </TagOffsetPopupContext.Provider>
    );
};
