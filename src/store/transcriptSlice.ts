import { TranscriptSlice, AppSliceCreator } from "./types";

// oxlint-disable-next-line no-unused-vars
import * as examples from "./exampleTranscriptData";

export const createTranscriptSlice: AppSliceCreator<TranscriptSlice> = (set) => ({
    streamId: "",
    streamTitle: "",
    activatedTime: 0,
    startTime: 0,
    mediaType: "none",
    mediaBaseUrl: "",
    isLive: false,
    transcript: [],
    setStreamId: (id) => set({ streamId: id }),
    setStreamTitle: (title) => set({ streamTitle: title }),
    setActivatedTime: (time) => set({ activatedTime: time }),
    setStartTime: (time) => set({ startTime: time }),
    setMediaType: (type) => set({ mediaType: type }),
    setMediaBaseUrl: (mediaUrl) => set({ mediaBaseUrl: mediaUrl }),
    setIsLive: (live) => set({ isLive: live }),
    setTranscript: (data) => set({ transcript: data }),
    addTranscriptLine: (newLine, receivedAt) => {
        set((state) => {
            // Used to prevent duplicate lines if the same line is received multiple times.
            // If we receive a line with the same id, we replace it and delete all lines after it.
            // Lines normally arrive in order, so check the tail before scanning the whole array.
            const transcript = state.transcript;
            const last = transcript[transcript.length - 1];
            const index = last && last.id < newLine.id ? -1 : transcript.findIndex((t) => t.id === newLine.id);
            const lastLineReceivedAt = receivedAt ?? state.lastLineReceivedAt;
            if (index !== -1) {
                return { transcript: [...transcript.slice(0, index), newLine], lastLineReceivedAt };
            }
            return { transcript: [...transcript, newLine], lastLineReceivedAt };
        });
    },
    updateLineMedia: (streamId, files, available = true) => {
        set((state) => {
            const apply = (lines: typeof state.transcript) => {
                let changed = false;
                const next = lines.map((line) => {
                    const fileId = files[line.id];
                    if (!fileId) return line;
                    changed = true;
                    return { ...line, mediaAvailable: available, fileId: fileId };
                });
                return changed ? next : null;
            };

            // Media can finish processing after a stream ended, so the past stream on screen gets it too.
            // Returning the same state skips the notification (and the array copies) when nothing changes.
            const partial: Partial<TranscriptSlice & { pastStreamTranscript: typeof state.transcript }> = {};
            if (state.streamId == streamId) {
                const transcript = apply(state.transcript);
                if (transcript) partial.transcript = transcript;
            }
            if (state.pastStreamViewing && state.pastStreamViewing == streamId) {
                const pastStreamTranscript = apply(state.pastStreamTranscript);
                if (pastStreamTranscript) partial.pastStreamTranscript = pastStreamTranscript;
            }
            return Object.keys(partial).length > 0 ? partial : state;
        });
    },
    updateLineVodAccurate: (ids, vodAccurate) => {
        set((state) => {
            const idSet = new Set(ids);
            return {
                transcript: state.transcript.map((line) => (idSet.has(line.id) ? { ...line, vodAccurate } : line)),
            };
        });
    },
    resetTranscript: () =>
        set({
            streamId: "",
            streamTitle: "",
            activatedTime: 0,
            startTime: 0,
            mediaType: "none",
            mediaBaseUrl: "",
            isLive: false,
            transcript: [],
        }),
});
