import { StateCreator } from "zustand";

// Data Structure Interfaces
export interface Segment {
    timestamp: number;
    text: string;
}

export interface TranscriptLine {
    id: number;
    fileId: string;
    segments: Segment[];
    timestamp: number;
    mediaAvailable?: boolean;
}

export interface StreamInfo {
    channelId: string;
    activeId: string;
    activeTitle: string;
    startTime: number;
    mediaType: "none" | "audio" | "video";
    isLive: boolean;
}

export type Files = {
    [key: number]: string;
};

// Slice Interfaces
export interface AudioSlice {
    audioId: number;
    setAudioId: (id: number) => void;
}

export interface ClipperSlice {
    clipPopupOpen: boolean;
    clipMode: boolean;
    clipStartIndex: number;
    clipEndIndex: number;
    clipInvalidBefore?: number;
    clipInvalidAfter?: number;
    setClipPopupOpen: (isOpen: boolean) => void;
    toggleClipMode: () => void;
    setClipStartIndex: (index: number) => void;
    setClipEndIndex: (index: number) => void;
    recalculateClipRange: () => void;
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
    mediaBaseUrl: string;
    isLive: boolean;
    transcript: TranscriptLine[];
    setActiveId: (id: string) => void;
    setActiveTitle: (title: string) => void;
    setStartTime: (time: number) => void;
    setMediaType: (type: TranscriptSlice["mediaType"]) => void;
    setMediaBaseUrl: (url: string) => void;
    setIsLive: (live: boolean) => void;
    setTranscript: (data: TranscriptLine[]) => void;
    addTranscriptLine: (newLine: TranscriptLine) => void;
    updateLineMedia: (streamId: string, files: Files, available?: boolean) => void;
    resetTranscript: () => void;
}

export interface PastStreamSlice {
    pastStreamViewing: string | null;
    pastStreams: StreamInfo[];
    pastStreamTranscript: TranscriptLine[];
    setPastStreamViewing: (streamId: string) => void;
    setPastStreams: (data: StreamInfo[]) => void;
    setPastStreamTranscript: (data: TranscriptLine[]) => void;
    resetPastStreams: () => void;
    resetPastStreamTranscript: () => void;
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
    useVirtualList: boolean;
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
    setUseVirtualList: (value: boolean) => void;
}

export interface PerformanceMetric {
    type?: "line" | "ping";
    id?: number;
    receivedAt: number;
    uploadTime?: number;
    latency: number;
    interArrival?: number;
}

export interface PerformanceSlice {
    metrics: PerformanceMetric[];
    lastLineReceivedAt: number;
    addMetric: (metric: PerformanceMetric) => void;
    setLastLineReceivedAt: (time: number) => void;
    clearMetrics: () => void;
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
    TagFormatterSlice &
    PastStreamSlice;

export interface TagFormatterSlice {
    formattedRows: any[];
    controls: Record<string, any>;
    inputTags: string;
    setFormattedRows: (rows: any[] | ((prev: any[]) => any[])) => void;
    setControls: (controls: Record<string, any>) => void;
    setInputTags: (tags: string) => void;
}

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
