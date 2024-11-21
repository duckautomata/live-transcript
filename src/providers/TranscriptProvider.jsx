/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import * as examples from "./exampleTranscriptData";

export const TranscriptContext = createContext({
    activeId: "",
    activeTitle: "",
    isLive: false,
    transcript: [],
    setActiveId: () => {},
    setActiveTitle: () => {},
    setIsLive: () => {},
    setTranscript: () => {},
});

export const TranscriptProvider = ({ children }) => {
    const [activeId, setActiveId] = useState("");
    const [activeTitle, setActiveTitle] = useState("");
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState([]);

    const transcriptValue = useMemo(
        () => ({ activeId, activeTitle, isLive, transcript, setActiveId, setActiveTitle, setIsLive, setTranscript }),
        [activeId, activeTitle, isLive, transcript],
    );

    return <TranscriptContext.Provider value={transcriptValue}>{children}</TranscriptContext.Provider>;
};
