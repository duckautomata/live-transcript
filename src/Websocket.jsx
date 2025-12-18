/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import { LOG_MSG, LOG_WARN, LOG_ERROR } from "./logic/debug";
import { wsServer } from "./config";
import { useAppStore } from "./store/store";

/**
 * @typedef {import('./store/types').TranscriptLine} TranscriptLine
 * @typedef {import('./store/types').TranscriptSlice['mediaType']} MediaType
 * @typedef {import('./store/types').ServerSlice['serverStatus']} ServerStatus
 */

/**
 * @typedef {object} ClientData
 * @property {string} [activeId]
 * @property {string} [activeTitle]
 * @property {number} [startTime]
 * @property {MediaType} [mediaType]
 * @property {boolean} [isLive]
 * @property {TranscriptLine[]} [transcript]
 */

/**
 * @typedef {object} WebSocketMessage
 * @property {string} event
 * @property {ClientData} [clientData]
 */

/**
 * Component for managing the WebSocket connection and state synchronization with the server.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
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
        if (typeof message !== "string") {
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

    /**
     * Resets the application state with the provided client data.
     * @param {ClientData} [clientData]
     */
    const resetState = (clientData) => {
        if (!clientData) {
            LOG_ERROR("resetState clientData is null");
            return;
        }

        LOG_MSG("resetState clientData", clientData);

        setActiveId(clientData.activeId ?? "");
        setActiveTitle(clientData.activeTitle ?? "");
        setStartTime(clientData.startTime ? +clientData.startTime : 0);
        setMediaType(clientData.mediaType ?? "none");
        setIsLive(clientData.isLive ?? false);

        /** @type {TranscriptLine[]} */
        let newTranscript = [];
        if (clientData.transcript) {
            newTranscript = [...clientData.transcript];
        }
        setTranscript(newTranscript);
    };

    /**
     * @param {string[]} parts
     */
    const addNewLine = (parts) => {
        if (!Array.isArray(parts) || parts.length % 2 !== 1) {
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

    /**
     * @param {string[]} parts
     */
    const setNewActiveStream = (parts) => {
        if (!Array.isArray(parts) || parts.length !== 6) {
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

    /**
     * @param {string[]} parts
     */
    const setStreamStatus = (parts) => {
        if (!Array.isArray(parts) || parts.length !== 4) {
            LOG_ERROR("setStreamStatus parts is not a valid array:", typeof parts, parts.length);
            return;
        }

        setActiveId(parts[1]);
        setActiveTitle(parts[2]);
        setIsLive(parts[3] === "true");
    };

    /**
     * @param {string[]} parts
     */
    const handleError = (parts) => {
        if (!Array.isArray(parts) || parts.length !== 3) {
            LOG_ERROR("handleError parts is not a valid array:", typeof parts, parts.length);
            return;
        }

        LOG_ERROR(`Error from relay. type: '${parts[1]}' message: '${parts[2]}'`);
    };
};
