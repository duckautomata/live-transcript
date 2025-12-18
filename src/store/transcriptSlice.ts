import { TranscriptSlice, AppSliceCreator } from "./types";

// eslint-disable-next-line no-unused-vars
import * as examples from "./exampleTranscriptData";

export const createTranscriptSlice: AppSliceCreator<TranscriptSlice> = (set) => ({
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
        set((state) => {
            // Used to prevent duplicate lines if the same line is received multiple times.
            // If we receive a line with the same id, we replace it and delete all lines after it.
            const index = state.transcript.findIndex((t) => t.id === newLine.id);
            if (index !== -1) {
                return { transcript: [...state.transcript.slice(0, index), newLine] };
            }
            return { transcript: [...state.transcript, newLine] };
        });
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
});
