/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { LOG_MSG, LOG_WARN, LOG_ERROR } from "./logic/debug";
import { wsServer } from "./config";
import { useAppStore } from "./store/store";

/**
 * @typedef {import('./store/types').TranscriptLine} TranscriptLine
 * @typedef {import('./store/types').Segment} Segment
 * @typedef {import('./store/types').TranscriptSlice['mediaType']} MediaType
 * @typedef {import('./store/types').ServerSlice['serverStatus']} ServerStatus
 */

/**
 * @typedef {object} EventSyncData
 * @property {string} [activeId]
 * @property {string} [activeTitle]
 * @property {number} [startTime]
 * @property {MediaType} [mediaType]
 * @property {boolean} [isLive]
 * @property {TranscriptLine[]} [transcript]
 */

/**
 * @typedef {object} EventNewLineData
 * @property {number} lineId
 * @property {number} timestamp
 * @property {number} uploadTime
 * @property {number} emittedTime
 * @property {boolean} mediaAvailable
 * @property {Segment[]} segments
 */

/**
 * @typedef {object} EventNewStreamData
 * @property {string} activeId
 * @property {string} activeTitle
 * @property {number} startTime
 * @property {MediaType} mediaType
 * @property {boolean} isLive
 */

/**
 * @typedef {object} EventStatusData
 * @property {string} activeId
 * @property {string} activeTitle
 * @property {boolean} isLive
 */

/**
 * @typedef {object} EventNewMediaData
 * @property {number[]} ids
 */

/**
 * @typedef {"newLine" | "newStream" | "status" | "sync" | "newMedia"} Events
 */

/**
 * @typedef {object} WebSocketMessage
 * @property {Events} event
 * @property {EventSyncData | EventNewLineData | EventNewStreamData | EventStatusData | EventNewMediaData} [data]
 */

/**
 * Component for managing the WebSocket connection and state synchronization with the server.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
export const Websocket = ({ wsKey }) => {
    const WS_URL = `${wsServer}/${wsKey}/websocket`;
    const setServerStatus = useAppStore((state) => state.setServerStatus);
    const setActiveId = useAppStore((state) => state.setActiveId);
    const setActiveTitle = useAppStore((state) => state.setActiveTitle);
    const setStartTime = useAppStore((state) => state.setStartTime);
    const setMediaType = useAppStore((state) => state.setMediaType);
    const setIsLive = useAppStore((state) => state.setIsLive);
    const setTranscript = useAppStore((state) => state.setTranscript);
    const addTranscriptLine = useAppStore((state) => state.addTranscriptLine);
    const updateLineMedia = useAppStore((state) => state.updateLineMedia);
    const recalculateClipRange = useAppStore((state) => state.recalculateClipRange);
    const addMetric = useAppStore((state) => state.addMetric);
    const setLastLineReceivedAt = useAppStore((state) => state.setLastLineReceivedAt);

    const lastReceiveTime = useRef(Date.now());

    const hasConnected = useRef(false);

    /** @type {{ lastJsonMessage: WebSocketMessage }} */
    const { lastJsonMessage } = useWebSocket(WS_URL, {
        share: false,
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onOpen: () => {
            setServerStatus("loading");
            hasConnected.current = true;
        },
        onClose: () => {
            if (hasConnected.current) {
                setServerStatus("reconnecting");
            } else {
                setServerStatus("connecting");
            }
        },
        onError: () => {
            if (hasConnected.current) {
                setServerStatus("reconnecting");
            } else {
                setServerStatus("connecting");
            }
        },
        onReconnectStop: () => setServerStatus("offline"),
    });
    useEffect(() => {
        hasConnected.current = false;
    }, [wsKey]);

    useEffect(() => {
        if (!lastJsonMessage) {
            return;
        }

        const { event, data } = lastJsonMessage;
        switch (event) {
            case "newLine":
                addNewLine(data);
                break;
            case "newStream":
                setNewActiveStream(data);
                break;
            case "status":
                setStreamStatus(data);
                break;
            case "sync":
                resetState(data);
                setServerStatus("online");
                break;
            case "newMedia":
                handleNewMedia(data);
                break;
            default:
                LOG_WARN("Unknown message event:", event, lastJsonMessage);
                break;
        }
    }, [lastJsonMessage]);

    /**
     * Resets the application state with the provided client data.
     * @param {EventSyncData | null} data
     */
    const resetState = (data) => {
        if (!data) {
            LOG_ERROR("resetState data is null");
            return;
        }

        LOG_MSG("resetState data", data);

        setActiveId(data.activeId ?? "");
        setActiveTitle(data.activeTitle ?? "");
        setStartTime(data.startTime ? +data.startTime : 0);
        setMediaType(data.mediaType ?? "none");
        setIsLive(data.isLive ?? false);

        /** @type {TranscriptLine[]} */
        let newTranscript = [];
        if (data.transcript) {
            newTranscript = [...data.transcript];
        }
        setTranscript(newTranscript);
    };

    /**
     * @param {EventNewLineData | null} data
     */
    const addNewLine = (data) => {
        if (!data) {
            LOG_ERROR("addNewLine data is null");
            return;
        }

        LOG_MSG("addNewLine data", data);

        const now = Date.now();
        const interArrival = now - lastReceiveTime.current;
        lastReceiveTime.current = now;
        setLastLineReceivedAt(now);

        const { lineId, timestamp, uploadTime, emittedTime, segments, mediaAvailable } = data;

        addMetric({
            id: lineId,
            receivedAt: now,
            serverEmittedAt: emittedTime,
            uploadTime: uploadTime,
            latency: now - emittedTime,
            interArrival,
        });

        const newLine = {
            id: lineId,
            timestamp: timestamp,
            segments: segments,
            mediaAvailable: mediaAvailable,
        };

        addTranscriptLine(newLine);
    };

    /**
     * @param {EventNewStreamData | null} data
     */
    const setNewActiveStream = (data) => {
        if (!data) {
            LOG_ERROR("setNewActiveStream data is null");
            return;
        }

        LOG_MSG("setNewActiveStream data", data);

        setActiveId(data.activeId);
        setActiveTitle(data.activeTitle);
        setStartTime(+data.startTime);
        setMediaType(data.mediaType);
        setIsLive(data.isLive);
        setTranscript([]);
    };

    /**
     * @param {EventStatusData | null} data
     */
    const setStreamStatus = (data) => {
        if (!data) {
            LOG_ERROR("setStreamStatus data is null");
            return;
        }

        LOG_MSG("setStreamStatus data", data);

        setActiveId(data.activeId);
        setActiveTitle(data.activeTitle);
        setIsLive(data.isLive);
    };

    /**
     * @param {EventNewMediaData | null} data
     */
    const handleNewMedia = (data) => {
        if (!data) {
            LOG_ERROR("handleNewMedia data is null");
            return;
        }

        LOG_MSG("handleNewMedia data", data);

        if (data?.ids && Array.isArray(data.ids)) {
            updateLineMedia(data.ids);
            recalculateClipRange();
        } else {
            LOG_ERROR("handleNewMedia data.ids is not an array", data);
        }
    };
};
