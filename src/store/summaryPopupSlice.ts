import { StateCreator } from "zustand";
import { AppStore } from "./types";

export interface SummaryPopupSlice {
    summaryPopupOpen: boolean;
    summaryPopupTimestamp: number;
    summaryPopupText: string;
    setSummaryPopupOpen: (open: boolean) => void;
    setSummaryPopupTimestamp: (timestamp: number) => void;
    setSummaryPopupText: (text: string) => void;
}

export const createSummaryPopupSlice: StateCreator<AppStore, [], [], SummaryPopupSlice> = (set) => ({
    summaryPopupOpen: false,
    summaryPopupTimestamp: 0,
    summaryPopupText: "",
    setSummaryPopupOpen: (open) => set({ summaryPopupOpen: open }),
    setSummaryPopupTimestamp: (timestamp) => set({ summaryPopupTimestamp: timestamp }),
    setSummaryPopupText: (text) => set({ summaryPopupText: text }),
});
