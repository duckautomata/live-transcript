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
    transcriptHeight: "100%" | "90%" | "75%" | "50%";
    enableTagHelper: boolean;
    defaultOffset: number;
    sidebarOpen: boolean;
    devMode: boolean;
    membershipKey: string;
    membershipInfo: { channel: string; expiresAt: string } | null;
    setTheme: (theme: SettingsSlice["theme"]) => void;
    setDensity: (density: SettingsSlice["density"]) => void;
    setTimeFormat: (format: SettingsSlice["timeFormat"]) => void;
    setTranscriptHeight: (height: SettingsSlice["transcriptHeight"]) => void;
    setEnableTagHelper: (value: boolean) => void;
    setDefaultOffset: (offset: number) => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setDevMode: (value: boolean) => void;
    setMembershipKey: (key: string) => void;
    setMembershipInfo: (info: SettingsSlice["membershipInfo"]) => void;
}

export interface PerformanceMetric {
    id: number;
    receivedAt: number;
    serverEmittedAt: number;
    uploadTime: number;
    latency: number;
    interArrival: number;
}

export interface PerformanceSlice {
    metrics: PerformanceMetric[];
    addMetric: (metric: PerformanceMetric) => void;
    clearMetrics: () => void;
}

export interface SummaryPopupSlice {
    summaryPopupOpen: boolean;
    summaryPopupTimestamp: number;
    summaryPopupText: string;
    setSummaryPopupOpen: (open: boolean) => void;
    setSummaryPopupTimestamp: (timestamp: number) => void;
    setSummaryPopupText: (text: string) => void;
}

// The combined store type
export type AppStore = AudioSlice &
    ClipperSlice &
    LineMenuSlice &
    TagPopupSlice &
    ServerSlice &
    TranscriptSlice &
    SettingsSlice &
    PerformanceSlice &
    SummaryPopupSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
