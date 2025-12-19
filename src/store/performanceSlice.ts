import { AppSliceCreator, PerformanceSlice } from "./types";

export const createPerformanceSlice: AppSliceCreator<PerformanceSlice> = (set) => ({
    metrics: [],
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
    clearMetrics: () => set({ metrics: [] }),
});
