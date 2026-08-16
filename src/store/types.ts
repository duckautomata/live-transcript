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
    vodAccurate?: boolean;
}

export interface StreamInfo {
    channelId: string;
    streamId: string;
    streamTitle: string;
    activatedTime: number;
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

export interface OpenSlice {
    infoOpen: boolean;
    helpOpen: boolean;
    settingsOpen: boolean;
    devToolsOpen: boolean;
    setInfoOpen: (isOpen: boolean) => void;
    setHelpOpen: (isOpen: boolean) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    setDevToolsOpen: (isOpen: boolean) => void;
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
    isSynced: boolean;
    setServerStatus: (status: ServerSlice["serverStatus"]) => void;
    setIsSynced: (isSynced: boolean) => void;
}

export interface TranscriptSlice {
    streamId: string;
    streamTitle: string;
    activatedTime: number;
    startTime: number;
    mediaType: "none" | "audio" | "video";
    mediaBaseUrl: string;
    isLive: boolean;
    transcript: TranscriptLine[];
    setStreamId: (id: string) => void;
    setStreamTitle: (title: string) => void;
    setActivatedTime: (time: number) => void;
    setStartTime: (time: number) => void;
    setMediaType: (type: TranscriptSlice["mediaType"]) => void;
    setMediaBaseUrl: (url: string) => void;
    setIsLive: (live: boolean) => void;
    setTranscript: (data: TranscriptLine[]) => void;
    addTranscriptLine: (newLine: TranscriptLine) => void;
    updateLineMedia: (streamId: string, files: Files, available?: boolean) => void;
    updateLineVodAccurate: (ids: number[], vodAccurate: boolean) => void;
    resetTranscript: () => void;
}

export interface PastStreamSlice {
    pastStreamViewing: string | null;
    pastStreams: StreamInfo[];
    pastStreamTranscript: TranscriptLine[];
    deletedStreamNotice: string | null;
    setPastStreamViewing: (streamId: string) => void;
    setPastStreams: (data: StreamInfo[]) => void;
    setPastStreamTranscript: (data: TranscriptLine[]) => void;
    removePastStream: (streamId: string) => void;
    setDeletedStreamNotice: (title: string | null) => void;
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

export interface LatenessRecord {
    streamId: string;
    streamName: string;
    platform: string;
    /** Scheduled start, ms since epoch. */
    scheduledMs: number;
    /** Actual start, ms since epoch. */
    actualMs: number;
}

export interface TrackerSlice {
    /** Matched schedule-vs-actual records, keyed by streamer (wsKey). */
    latenessHistory: Record<string, LatenessRecord[]>;
    addLatenessRecords: (wsKey: string, records: LatenessRecord[]) => void;
    /** Clears a single streamer's history, or every streamer when omitted. */
    clearLatenessHistory: (wsKey?: string) => void;
    /**
     * Dev-only Stream Tracker schedule scenario; "off" uses the real schedule.
     * Deliberately not persisted, so a refresh always returns to the real data.
     */
    scheduleMock: string;
    setScheduleMock: (scenario: string) => void;
}

export interface TagFormatterSlice {
    formattedRows: any[];
    controls: Record<string, any>;
    inputTags: string;
    setFormattedRows: (rows: any[] | ((prev: any[]) => any[])) => void;
    setControls: (controls: Record<string, any>) => void;
    setInputTags: (tags: string) => void;
}

// The combined store type
export type AppStore = AudioSlice &
    ClipperSlice &
    LineMenuSlice &
    OpenSlice &
    TagPopupSlice &
    ServerSlice &
    TranscriptSlice &
    SettingsSlice &
    PerformanceSlice &
    TagFormatterSlice &
    PastStreamSlice &
    TrackerSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
