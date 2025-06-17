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
        set((state) => ({ transcript: [...state.transcript, newLine] }));
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
