/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";

export const AudioContext = createContext({
    audioId: -1,
    setAudioId: () => {},
});

export const AudioProvider = ({ children }) => {
    const [audioId, setAudioId] = useState(-1);
    const audioValue = useMemo(() => ({ audioId, setAudioId }), [audioId]);

    return <AudioContext.Provider value={audioValue}>{children}</AudioContext.Provider>;
};
