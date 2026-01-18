import { PastStreamSlice, AppSliceCreator } from "./types";

export const createPastStreamSlice: AppSliceCreator<PastStreamSlice> = (set) => ({
    pastStreamViewing: null,
    pastStreams: [],
    pastStreamTranscript: [],
    setPastStreamViewing: (id) => set({ pastStreamViewing: id }),
    setPastStreams: (data) => set({ pastStreams: data }),
    setPastStreamTranscript: (data) => set({ pastStreamTranscript: data }),
    resetPastStreams: () => set({ pastStreams: [], pastStreamViewing: null, pastStreamTranscript: [] }),
    resetPastStreamTranscript: () => set({ pastStreamTranscript: [] }),
});
