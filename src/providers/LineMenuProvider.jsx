/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";

export const LineMenuContext = createContext({
    anchorEl: false,
    lineMenuId: -1,
    setAnchorEl: () => {},
    setLineMenuId: () => {},
});

export const LineMenuProvider = ({ children }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [lineMenuId, setLineMenuId] = useState(-1);
    const popupValue = useMemo(() => ({ anchorEl, lineMenuId, setAnchorEl, setLineMenuId }), [anchorEl, lineMenuId]);

    return <LineMenuContext.Provider value={popupValue}>{children}</LineMenuContext.Provider>;
};
