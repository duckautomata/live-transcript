import { create } from "zustand";
import { persist } from "zustand/middleware";

// eslint-disable-next-line no-unused-vars
import * as examples from "./exampleTranscriptData";

interface Segment {
    timestamp: number;
    text: string;
}

interface TranscriptLine {
    id: number;
    segments: Segment[];
    timestamp: number;
}

interface AppState {
    audioId: number;
    clipPopupOpen: boolean;
    clipStartIndex: number;
    clipEndIndex: number;
    lineAnchorEl: HTMLElement | null;
    lineMenuId: number;
    tagPopupOpen: boolean;
    tagPopupTimestamp: number;
    tagPopupText: string;
    serverStatus: "online" | "loading" | "connecting" | "offline";
    activeId: string;
    activeTitle: string;
    startTime: number;
    mediaType: string;
    isLive: boolean;
    transcript: TranscriptLine[];
    theme: "light" | "system" | "dark";
    density: "compact" | "standard" | "comfortable";
    timeFormat: "relative" | "local" | "UTC";
    newAtTop: boolean;
    enableTagHelper: boolean;
    defaultOffset: string;
    sidebarOpen: boolean;
}

interface AppActions {
    setAudioId: (id: number) => void;
    setClipPopupOpen: (isOpen: boolean) => void;
    setClipStartIndex: (index: number) => void;
    setClipEndIndex: (index: number) => void;
    setLineAnchorEl: (el: HTMLElement | null) => void;
    setLineMenuId: (id: number) => void;
    setTagPopupOpen: (isOpen: boolean) => void;
    setTagPopupTimestamp: (ts: number) => void;
    setTagPopupText: (text: string) => void;
    resetTagOffsetPopup: () => void;
    setServerStatus: (status: AppState["serverStatus"]) => void;
    setActiveId: (id: string) => void;
    setActiveTitle: (title: string) => void;
    setStartTime: (time: number) => void;
    setMediaType: (type: string) => void;
    setIsLive: (live: boolean) => void;
    setTranscript: (data: TranscriptLine[]) => void;
    addTranscriptLine: (newLine: TranscriptLine) => void;
    resetTranscript: () => void;
    setTheme: (theme: AppState["theme"]) => void;
    setDensity: (density: AppState["density"]) => void;
    setTimeFormat: (format: AppState["timeFormat"]) => void;
    setNewAtTop: (value: boolean) => void;
    setEnableTagHelper: (value: boolean) => void;
    setDefaultOffset: (offset: string) => void;
    setSidebarOpen: (isOpen: boolean) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // --- Audio Slice ---
            audioId: -1,
            setAudioId: (id) => set({ audioId: id }),

            // --- Clipper Popup Slice ---
            clipPopupOpen: false,
            clipStartIndex: -1,
            clipEndIndex: -1,
            setClipPopupOpen: (isOpen) => set({ clipPopupOpen: isOpen }),
            setClipStartIndex: (index) => set({ clipStartIndex: index }),
            setClipEndIndex: (index) => set({ clipEndIndex: index }),

            // --- Line Menu Slice ---
            lineAnchorEl: null,
            lineMenuId: -1,
            setLineAnchorEl: (el) => set({ lineAnchorEl: el }),
            setLineMenuId: (id) => set({ lineMenuId: id }),

            // --- Tag Offset Popup Slice ---
            tagPopupOpen: false,
            tagPopupTimestamp: 0,
            tagPopupText: "",
            setTagPopupOpen: (isOpen) => set({ tagPopupOpen: isOpen }),
            setTagPopupTimestamp: (ts) => set({ tagPopupTimestamp: ts }),
            setTagPopupText: (text) => set({ tagPopupText: text }),
            resetTagOffsetPopup: () =>
                set({
                    tagPopupOpen: false,
                    tagPopupTimestamp: 0,
                    tagPopupText: "",
                }),

            // --- Server Slice ---
            serverStatus: "connecting",
            setServerStatus: (status) => set({ serverStatus: status }),

            // --- Transcript Slice ---
            activeId: "",
            activeTitle: "",
            startTime: 0,
            mediaType: "none",
            isLive: false,
            transcript: [],
            setActiveId: (id) => set({ activeId: id }),
            setActiveTitle: (title) => set({ activeTitle: title }),
            setStartTime: (time) => set({ startTime: time }),
            setMediaType: (type) => set({ mediaType: type }),
            setIsLive: (live) => set({ isLive: live }),
            setTranscript: (data) => set({ transcript: data }),
            addTranscriptLine: (newLine) => {
                const { transcript } = get();
                const updatedTranscript = [...transcript, newLine];
                set({ transcript: updatedTranscript });
            },
            resetTranscript: () =>
                set({
                    activeId: "",
                    activeTitle: "",
                    startTime: 0,
                    mediaType: "none",
                    isLive: false,
                    transcript: [],
                }),

            // --- Settings Slice ---
            theme: "system",
            density: "standard",
            timeFormat: "relative",
            newAtTop: true,
            enableTagHelper: false,
            defaultOffset: "-20",
            sidebarOpen: true,
            setTheme: (theme) => set({ theme }),
            setDensity: (density) => set({ density }),
            setTimeFormat: (format) => set({ timeFormat: format }),
            setNewAtTop: (value) => set({ newAtTop: value }),
            setEnableTagHelper: (value) => set({ enableTagHelper: value }),
            setDefaultOffset: (offset) => set({ defaultOffset: offset }),
            setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
        }),
        {
            name: "live-transcript-settings", // The key in localStorage
            // We only want to persist the 'settings' slice of our state
            partialize: (state) => ({
                theme: state.theme,
                density: state.density,
                timeFormat: state.timeFormat,
                newAtTop: state.newAtTop,
                enableTagHelper: state.enableTagHelper,
                defaultOffset: state.defaultOffset,
                sidebarOpen: state.sidebarOpen,
            }),
        },
    ),
);
