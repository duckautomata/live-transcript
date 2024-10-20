import { createContext, useMemo, useState } from "react";
import TagOffsetPopup from "../components/TagOffsetPopup";

export const TagOffsetPopupContext = createContext({
    open: false,
    timestamp: 0,
    setOpen: () => {},
    setTimestamp: () => {},
});

export const TagOffsetPopupProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [timestamp, setTimestamp] = useState(0);
    const popupValue = useMemo(() => ({ open, timestamp, setOpen, setTimestamp }), [open, timestamp]);

    return (
        <TagOffsetPopupContext.Provider value={popupValue}>
            <TagOffsetPopup open={open} setOpen={setOpen} timestamp={timestamp} />
            {children}
        </TagOffsetPopupContext.Provider>
    );
};
