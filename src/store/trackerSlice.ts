import { AppSliceCreator, LatenessRecord, TrackerSlice } from "./types";

/**
 * The server only caches a handful of past streams, so the tracker keeps every
 * matched stream it has ever seen. Capped to bound localStorage growth.
 */
const MAX_RECORDS_PER_KEY = 250;

/**
 * Combine two record sets, keeping one entry per stream id with the incoming
 * record winning. Returns null when the merge would be a no-op so the store
 * (and its localStorage write) stays untouched.
 */
function mergeRecords(existing: LatenessRecord[], incoming: LatenessRecord[]): LatenessRecord[] | null {
    const byId = new Map<string, LatenessRecord>();
    existing.forEach((record) => {
        if (record?.streamId) byId.set(record.streamId, record);
    });

    let changed = false;
    incoming.forEach((record) => {
        if (!record?.streamId) return;
        const previous = byId.get(record.streamId);
        if (
            previous &&
            previous.scheduledMs === record.scheduledMs &&
            previous.actualMs === record.actualMs &&
            previous.streamName === record.streamName
        ) {
            return;
        }
        byId.set(record.streamId, record);
        changed = true;
    });

    if (!changed) return null;

    const merged = [...byId.values()].sort((a, b) => a.scheduledMs - b.scheduledMs);
    // Drop the oldest entries once we exceed the cap.
    return merged.length > MAX_RECORDS_PER_KEY ? merged.slice(merged.length - MAX_RECORDS_PER_KEY) : merged;
}

export const createTrackerSlice: AppSliceCreator<TrackerSlice> = (set) => ({
    latenessHistory: {},
    // Dev-tool state, intentionally left out of the persisted settings so a
    // refresh always drops back to the real schedule.
    scheduleMock: "off",
    setScheduleMock: (scenario) => set({ scheduleMock: scenario }),
    addLatenessRecords: (wsKey, records) =>
        set((state) => {
            if (!wsKey || !records?.length) return {};

            const merged = mergeRecords(state.latenessHistory[wsKey] ?? [], records);
            if (!merged) return {};

            return { latenessHistory: { ...state.latenessHistory, [wsKey]: merged } };
        }),
    clearLatenessHistory: (wsKey) =>
        set((state) => {
            if (!wsKey) return { latenessHistory: {} };
            if (!state.latenessHistory[wsKey]) return {};

            const next = { ...state.latenessHistory };
            delete next[wsKey];
            return { latenessHistory: next };
        }),
});
