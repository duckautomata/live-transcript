import { AppSliceCreator, TrackerSlice } from "./types";

export const createTrackerSlice: AppSliceCreator<TrackerSlice> = (set) => ({
    // Dev-tool state, intentionally left out of the persisted settings so a
    // refresh always drops back to the real schedule.
    scheduleMock: "off",
    setScheduleMock: (scenario) => set({ scheduleMock: scenario }),
});
