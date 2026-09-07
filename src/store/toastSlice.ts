import { ToastSlice, AppSliceCreator } from "./types";

let toastKey = 0;

export const createToastSlice: AppSliceCreator<ToastSlice> = (set) => ({
    toast: null,
    showToast: (message, severity = "success") => set({ toast: { key: ++toastKey, message, severity } }),
    hideToast: () => set({ toast: null }),
});
