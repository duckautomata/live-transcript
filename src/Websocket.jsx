/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import { LOG_MSG, LOG_WARN, LOG_ERROR } from "./logic/debug";
import { wsServer } from "./config";
import { useAppStore } from "./store/store";

export const Websocket = ({ wsKey }) => {
    const WS_URL = `${wsServer}/ws/${wsKey}`;
    const setServerStatus = useAppStore((state) => state.setServerStatus);
    const setActiveId = useAppStore((state) => state.setActiveId);
    const setActiveTitle = useAppStore((state) => state.setActiveTitle);
    const setStartTime = useAppStore((state) => state.setStartTime);
    const setMediaType = useAppStore((state) => state.setMediaType);
    const setIsLive = useAppStore((state) => state.setIsLive);
    const setTranscript = useAppStore((state) => state.setTranscript);
    const addTranscriptLine = useAppStore((state) => state.addTranscriptLine);

    const { lastMessage, lastJsonMessage } = useWebSocket(WS_URL, {
        share: false,
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onOpen: () => setServerStatus("loading"),
        onClose: () => setServerStatus("connecting"),
        onError: () => setServerStatus("connecting"),
        onReconnectStop: () => setServerStatus("offline"),
    });

    useEffect(() => {
        if (lastJsonMessage?.event !== "hardrefresh") {
            return;
        }
        resetState(lastJsonMessage?.clientData);
        setServerStatus("online");
    }, [lastJsonMessage]);

    useEffect(() => {
        if (lastMessage === null) {
            LOG_WARN("lastMessage is null");
            return;
        }
        const message = lastMessage.data;
        if (typeof message !== typeof "") {
            LOG_WARN("message is not a string", typeof message, message);
            return;
        }
        if (message.length < 4 || message.substring(0, 3) !== "![]") {
            LOG_WARN("message is too small or doesn't have the starting key", message.length, message.substring(0, 3));
            return;
        }
        const parts = message.split("\n");
        const event = parts?.[0];
        switch (event) {
            case "![]refresh":
                LOG_MSG("addNewLine event", parts);
                addNewLine(parts);
                break;
            case "![]newstream":
                LOG_MSG("setNewActiveStream event", parts);
                setNewActiveStream(parts);
                break;
            case "![]status":
                LOG_MSG("setStreamStatus event", parts);
                setStreamStatus(parts);
                break;
            case "![]error":
                LOG_MSG("handleError event", parts);
                handleError(parts);
                break;
            default:
                LOG_ERROR("unknown event from relay:", event);
                break;
        }
    }, [lastMessage]);

    // {activeId, activeTitle, isLive, transcript}
    const resetState = (clientData) => {
        if (clientData === null) {
            LOG_ERROR("resetState clientData is null");
            return;
        }

        LOG_MSG("resetState clientData", clientData);

        setActiveId(clientData.activeId ?? "");
        setActiveTitle(clientData.activeTitle ?? "");
        setStartTime(clientData.startTime ? +clientData.startTime : 0);
        setMediaType(clientData.mediaType ?? "none");
        setIsLive(clientData.isLive ?? false);

        let newTranscript = [];
        if (clientData.transcript !== null && clientData.transcript !== undefined) {
            newTranscript = [...clientData.transcript];
        }
        setTranscript(newTranscript);
    };

    // [event, id, lineTimestamp, ts1, text1, ts2, text2, ..."]
    const addNewLine = (parts) => {
        if (typeof parts !== typeof [] || parts.length % 2 !== 1) {
            LOG_ERROR("addNewLine parts is not a valid array:", typeof parts, parts.length);
            return;
        }

        const segments = [];
        for (let i = 3; i < parts.length; i += 2) {
            const newSegment = {
                timestamp: +parts[i],
                text: parts[i + 1],
            };
            segments.push(newSegment);
        }
        const newLine = {
            id: +parts[1],
            timestamp: +parts[2],
            segments: segments,
        };

        addTranscriptLine(newLine);
    };

    // [event, activeId, activeTitle, startTime, mediaType, isLive]
    const setNewActiveStream = (parts) => {
        if (typeof parts !== typeof [] || parts.length !== 6) {
            LOG_ERROR("setNewActiveStream parts is not a valid array:", typeof parts, parts.length);
            return;
        }

        setActiveId(parts[1]);
        setActiveTitle(parts[2]);
        setStartTime(+parts[3]);
        setMediaType(parts[4]);
        setIsLive(parts[5] === "true");
        setTranscript([]);
    };

    // [event, activeId, activeTitle, isLive]
    const setStreamStatus = (parts) => {
        if (typeof parts !== typeof [] || parts.length !== 4) {
            LOG_ERROR("setStreamStatus parts is not a valid array:", typeof parts, parts.length);
            return;
        }

        setActiveId(parts[1]);
        setActiveTitle(parts[2]);
        setIsLive(parts[3] === "true");
    };

    // [event, errorType, errorMessage]
    const handleError = (parts) => {
        if (typeof parts !== typeof [] || parts.length !== 3) {
            LOG_ERROR("handleError parts is not a valid array:", typeof parts, parts.length);
            return;
        }

        LOG_ERROR(`Error from relay. type: '${parts[1]}' message: '${parts[2]}'`);
    };
};
