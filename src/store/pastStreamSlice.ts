import { PastStreamSlice, AppSliceCreator } from "./types";

export const createPastStreamSlice: AppSliceCreator<PastStreamSlice> = (set) => ({
    pastStreamViewing: null,
    pastStreams: [],
    pastStreamTranscript: [],
    deletedStreamNotice: null,
    setPastStreamViewing: (id) => set({ pastStreamViewing: id }),
    setPastStreams: (data) => set({ pastStreams: data }),
    setPastStreamTranscript: (data) => set({ pastStreamTranscript: data }),
    removePastStream: (streamId) =>
        set((state) => {
            const next: Partial<PastStreamSlice> = {
                pastStreams: state.pastStreams.filter((s) => s.streamId !== streamId),
            };
            // If the user was viewing the deleted stream, reset that view too.
            // The View component's existing reconciliation effect skips this case
            // when the deletion empties pastStreams entirely, so handle it here.
            if (state.pastStreamViewing === streamId) {
                next.pastStreamViewing = null;
                next.pastStreamTranscript = [];
            }
            return next;
        }),
    setDeletedStreamNotice: (title) => set({ deletedStreamNotice: title }),
    resetPastStreams: () => set({ pastStreams: [], pastStreamViewing: null, pastStreamTranscript: [] }),
    resetPastStreamTranscript: () => set({ pastStreamTranscript: [] }),
});
