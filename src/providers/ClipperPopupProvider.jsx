/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";

export const ClipperPopupContext = createContext({
    clipPopupOpen: false,
    clipStartIndex: -1,
    clipEndIndex: -1,
    maxClipSize: 20,
    setClipPopupOpen: () => {},
    setClipStartIndex: () => {},
    setClipEndIndex: () => {},
});

export const ClipperPopupProvider = ({ children }) => {
    const [clipPopupOpen, setClipPopupOpen] = useState(false);
    const [clipStartIndex, setClipStartIndex] = useState(-1);
    const [clipEndIndex, setClipEndIndex] = useState(-1);
    const maxClipSize = 20;
    const popupValue = useMemo(
        () => ({
            clipPopupOpen,
            clipStartIndex,
            clipEndIndex,
            maxClipSize,
            setClipPopupOpen,
            setClipStartIndex,
            setClipEndIndex,
        }),
        [clipPopupOpen, clipStartIndex, clipEndIndex],
    );

    return <ClipperPopupContext.Provider value={popupValue}>{children}</ClipperPopupContext.Provider>;
};
