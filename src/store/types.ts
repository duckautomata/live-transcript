import { StateCreator } from "zustand";

// Data Structure Interfaces
export interface Segment {
    timestamp: number;
    text: string;
}

export interface TranscriptLine {
    id: number;
    segments: Segment[];
    timestamp: number;
}

// Slice Interfaces
export interface AudioSlice {
    audioId: number;
    setAudioId: (id: number) => void;
}

export interface ClipperSlice {
    clipPopupOpen: boolean;
    clipStartIndex: number;
    clipEndIndex: number;
    setClipPopupOpen: (isOpen: boolean) => void;
    setClipStartIndex: (index: number) => void;
    setClipEndIndex: (index: number) => void;
}

export interface LineMenuSlice {
    lineMenuId: number;
    setLineMenuId: (id: number) => void;
}

export interface TagPopupSlice {
    tagPopupOpen: boolean;
    tagPopupTimestamp: number;
    tagPopupText: string;
    setTagPopupOpen: (isOpen: boolean) => void;
    setTagPopupTimestamp: (ts: number) => void;
    setTagPopupText: (text: string) => void;
    resetTagOffsetPopup: () => void;
}

export interface ServerSlice {
    serverStatus: "online" | "loading" | "connecting" | "offline";
    setServerStatus: (status: ServerSlice["serverStatus"]) => void;
}

export interface TranscriptSlice {
    activeId: string;
    activeTitle: string;
    startTime: number;
    mediaType: "none" | "audio" | "video";
    isLive: boolean;
    transcript: TranscriptLine[];
    setActiveId: (id: string) => void;
    setActiveTitle: (title: string) => void;
    setStartTime: (time: number) => void;
    setMediaType: (type: TranscriptSlice["mediaType"]) => void;
    setIsLive: (live: boolean) => void;
    setTranscript: (data: TranscriptLine[]) => void;
    addTranscriptLine: (newLine: TranscriptLine) => void;
    resetTranscript: () => void;
}

export interface SettingsSlice {
    theme: "light" | "system" | "dark";
    density: "compact" | "standard" | "comfortable";
    timeFormat: "relative" | "local" | "UTC";
    newAtTop: boolean;
    enableTagHelper: boolean;
    defaultOffset: number;
    sidebarOpen: boolean;
    setTheme: (theme: SettingsSlice["theme"]) => void;
    setDensity: (density: SettingsSlice["density"]) => void;
    setTimeFormat: (format: SettingsSlice["timeFormat"]) => void;
    setNewAtTop: (value: boolean) => void;
    setEnableTagHelper: (value: boolean) => void;
    setDefaultOffset: (offset: number) => void;
    setSidebarOpen: (isOpen: boolean) => void;
}

// The combined store type
export type AppStore = AudioSlice &
    ClipperSlice &
    LineMenuSlice &
    TagPopupSlice &
    ServerSlice &
    TranscriptSlice &
    SettingsSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
