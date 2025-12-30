import { AppSliceCreator, PerformanceSlice } from "./types";

export const createPerformanceSlice: AppSliceCreator<PerformanceSlice> = (set) => ({
    metrics: [],
    lastLineReceivedAt: 0,
    addMetric: (metric) =>
        set((state) => {
            if (!state.devMode) return { metrics: state.metrics };

            const newMetrics = [...state.metrics, metric];
            // Limit history to last 200 points to prevent memory issues
            if (newMetrics.length > 200) {
                newMetrics.shift();
            }
            return { metrics: newMetrics };
        }),
    setLastLineReceivedAt: (time) => set({ lastLineReceivedAt: time }),
    clearMetrics: () => set({ metrics: [], lastLineReceivedAt: 0 }),
});
