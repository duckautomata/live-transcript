/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
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
    const resetTranscript = useAppStore((state) => state.resetTranscript);
    const setAudioId = useAppStore((state) => state.setAudioId);

    const lastReceiveTime = useRef(Date.now());

    const hasConnected = useRef(false);

    const [shouldConnect, setShouldConnect] = useState(true);
    const disconnectTimeout = useRef(null);
    const readyStateRef = useRef(ReadyState.CLOSED);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            if (isVisible) {
                if (disconnectTimeout.current) {
                    clearTimeout(disconnectTimeout.current);
                    disconnectTimeout.current = null;
                    if (readyStateRef.current === ReadyState.OPEN) {
                        setServerStatus("online");
                    }
                } else {
                    setShouldConnect(true);
                }
            } else {
                disconnectTimeout.current = setTimeout(
                    () => {
                        setServerStatus("connecting");
                        setShouldConnect(false);
                        disconnectTimeout.current = null;
                    },
                    10 * 60 * 1000,
                ); // 10 minutes
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    // If the page is not visible, pass null to useWebSocket to close/prevent connection
    // When it becomes visible again, the URL is passed, causing a reconnect
    const { lastJsonMessage, sendMessage, readyState } = useWebSocket(shouldConnect ? WS_URL : null, {
        share: false,
        shouldReconnect: () => shouldConnect, // Only reconnect if we want to be connected
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onOpen: () => {
            setServerStatus("loading");
            hasConnected.current = true;
        },
        onClose: () => {
            if (document.hidden) {
                return;
                // If not visible, we don't need to update status or can leave it as is
                // because the user isn't looking.
            }
            if (hasConnected.current) {
                setServerStatus("reconnecting");
            } else {
                setServerStatus("connecting");
            }
        },
        onError: () => {
            if (document.hidden) {
                return;
            }
            if (hasConnected.current) {
                setServerStatus("reconnecting");
            } else {
                setServerStatus("connecting");
            }
        },
        onReconnectStop: () => setServerStatus("offline"),
    });

    useEffect(() => {
        readyStateRef.current = readyState;
    }, [readyState]);
    useEffect(() => {
        hasConnected.current = false;
        resetTranscript();
        setServerStatus("connecting");
        setAudioId(-1);
    }, [wsKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (readyState === ReadyState.OPEN) {
                sendMessage(JSON.stringify({ event: "ping", data: { timestamp: Date.now() } }));
            }
        }, 45000);

        return () => clearInterval(interval);
    }, [readyState, sendMessage]);

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
                if (!document.hidden) {
                    setServerStatus("online");
                }
                break;
            case "newMedia":
                handleNewMedia(data);
                break;
            case "pong": {
                const { timestamp } = data;
                const latency = Date.now() - timestamp;
                addMetric({
                    type: "ping",
                    latency,
                    receivedAt: Date.now(),
                });
                break;
            }
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

        const { lineId, timestamp, uploadTime, segments, mediaAvailable } = data;

        addMetric({
            type: "line",
            id: lineId,
            receivedAt: now,
            uploadTime: uploadTime,
            latency: 0, // No emittedTime to calc latency against
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
