/* eslint-disable react-refresh/only-export-components */

import { createContext, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import * as examples from "./exampleTranscriptData";

export const TranscriptContext = createContext({
    activeId: "",
    activeTitle: "",
    startTime: 0,
    mediaType: "none",
    isLive: false,
    transcript: [],
    setActiveId: () => {},
    setActiveTitle: () => {},
    setStartTime: () => {},
    setMediaType: () => {},
    setIsLive: () => {},
    setTranscript: () => {},
});

export const TranscriptProvider = ({ children }) => {
    const [activeId, setActiveId] = useState("");
    const [activeTitle, setActiveTitle] = useState("");
    const [startTime, setStartTime] = useState(0);
    const [mediaType, setMediaType] = useState("none");
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState([]);

    const transcriptValue = useMemo(
        () => ({
            activeId,
            activeTitle,
            startTime,
            mediaType,
            isLive,
            transcript,
            setActiveId,
            setActiveTitle,
            setStartTime,
            setMediaType,
            setIsLive,
            setTranscript,
        }),
        [activeId, activeTitle, startTime, mediaType, isLive, transcript],
    );

    return <TranscriptContext.Provider value={transcriptValue}>{children}</TranscriptContext.Provider>;
};
