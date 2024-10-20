import { useCallback, useContext, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { TranscriptContext } from "./providers/TranscriptProvider";
import { SettingContext } from "./providers/SettingProvider"

const MessageType = {
    NEW_LINE: "newline",
    CLEAR_ALL: "clearall",
    RESET: "reset",
    MISSING: "missing",
    STATUS: "status",
    STATUS_LIVE: "live",
    STATUS_ENDED: "ended",
    ERROR: "error"
}

export const Websocket = () => {
    const {wsKey} = useContext(SettingContext)
    const WS_URL = `ws://207.211.182.145/ws/${wsKey}`;
    const {
        transcript, 
        setActiveId, setActiveTitle, setIsLive, setTranscript
    } = useContext(TranscriptContext)

    const { sendMessage, lastMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
        share: false,
        shouldReconnect: (closeEvent) => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
    });

    useEffect(() => {
        if (lastJsonMessage?.event !== "hardrefresh") {
            return
        }
        resetState(lastJsonMessage?.clientData)
    }, [lastJsonMessage]);

    useEffect(() => {
        if (lastMessage === null) {
            // console.log("lastMessage is null");
            return
        }
        const message = lastMessage.data;
        if (typeof(message) !== typeof("")) {
            // console.log("message is not a string", typeof(message), message);
            return
        }
        if (message.length < 4 || message.substring(0, 3) !== "![]") {
            // console.log("message is too small or doens't have the starting key", message.length, message.substring(0, 3));
            return
        }
        const parts = message.split("\n")
        const event = parts?.[0];
        switch (event) {
            case "![]refresh":
                // console.log("addNewLine event", parts);
                addNewLine(parts)
                break;
            case "![]newstream":
                // console.log("setNewActiveStream event", parts);
                setNewActiveStream(parts)
                break;
            case "![]status":
                // console.log("setStreamStatus event", parts);
                setStreamStatus(parts)
                break;
            case "![]error":
                // console.log("handleError event", parts);
                handleError(parts)
                break;
            default:
                // console.log("Error: unknown event from relay:", event);
                break;
        }
    }, [lastMessage]);


    // {activeId, activeTitle, isLive, transcript}
    const resetState = (clientData) => {
        if (clientData === null) {
            // console.log("Error: resetState clientData is null");
            return
        }

        // console.log("resetState clientData", clientData);
        

        setActiveId(clientData.activeId ?? "")
        setActiveTitle(clientData.activeTitle ?? "")
        setIsLive(clientData.isLive ?? false)

        let newTranscript = []
        if (clientData.transcript !== null && clientData.transcript !== undefined) {
            newTranscript = [...clientData.transcript]
        }
        setTranscript(newTranscript)
    }

    // [event, id, ts1, text1, ts2, text2, ..."]
    // 
    const addNewLine = (parts) => {
        if (typeof(parts) !== typeof([]) || parts.length % 2 !== 0) {
            // console.log("Error: addNewLine parts is not a valid array:", typeof(parts), parts.length);
            return
        }

        const segments = []
        for (let i = 2; i < parts.length; i+=2) {
            const newSegment = {
                timestamp: +parts[i],
                text: parts[i+1],
            }
            segments.push(newSegment)
        }
        const newLine = {
            id: +parts[1],
            segments: segments
        }

        setTranscript([...transcript, newLine])
    }

    // [event, activeId, activeTitle, isLive]
    const setNewActiveStream = (parts) => {
        if (typeof(parts) !== typeof([]) || parts.length !== 4) {
            // console.log("Error: setNewActiveStream parts is not a valid array:", typeof(parts), parts.length);
            return
        }

        setActiveId(parts[1])
        setActiveTitle(parts[2])
        setIsLive(parts[3] === "true")
        setTranscript([])
    }

    // [event, activeId, activeTitle, isLive]
    const setStreamStatus = (parts) => {
        if (typeof(parts) !== typeof([]) || parts.length !== 4) {
            // console.log("Error: setStreamStatus parts is not a valid array:", typeof(parts), parts.length);
            return
        }

        setActiveId(parts[1])
        setActiveTitle(parts[2])
        setIsLive(parts[3] === "true")
    }

    // [event, errorType, errorMessage]
    const handleError = (parts) => {
        if (typeof(parts) !== typeof([]) || parts.length !== 3) {
            // console.log("Error: handleError parts is not a valid array:", typeof(parts), parts.length);
            return
        }
        
        // console.log(`Error from relay. type: '${parts[1]}' message: '${parts[2]}'`);
    }
};
