/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import * as examples from "./exampleTranscriptData";

export const TranscriptContext = createContext({
    activeId: "",
    activeTitle: "",
    startTime: 0,
    isLive: false,
    transcript: [],
    setActiveId: () => {},
    setActiveTitle: () => {},
    setStartTime: () => {},
    setIsLive: () => {},
    setTranscript: () => {},
});

export const TranscriptProvider = ({ children }) => {
    const [activeId, setActiveId] = useState("");
    const [activeTitle, setActiveTitle] = useState("");
    const [startTime, setStartTime] = useState(0);
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState([]);

    const transcriptValue = useMemo(
        () => ({
            activeId,
            activeTitle,
            startTime,
            isLive,
            transcript,
            setActiveId,
            setActiveTitle,
            setStartTime,
            setIsLive,
            setTranscript,
        }),
        [activeId, activeTitle, startTime, isLive, transcript],
    );

    return <TranscriptContext.Provider value={transcriptValue}>{children}</TranscriptContext.Provider>;
};
