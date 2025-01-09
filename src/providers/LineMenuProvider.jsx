/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";

export const LineMenuContext = createContext({
    anchorEl: false,
    id: 0,
    setAnchorEl: () => {},
    setId: () => {},
});

export const LineMenuProvider = ({ children }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [id, setId] = useState(-1);
    const popupValue = useMemo(() => ({ anchorEl, id, setAnchorEl, setId }), [anchorEl, id]);

    return <LineMenuContext.Provider value={popupValue}>{children}</LineMenuContext.Provider>;
};
