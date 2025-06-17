import { TagPopupSlice, AppSliceCreator } from "./types";

export const createTagPopupSlice: AppSliceCreator<TagPopupSlice> = (set) => ({
    tagPopupOpen: false,
    tagPopupTimestamp: 0,
    tagPopupText: "",
    setTagPopupOpen: (isOpen) => set({ tagPopupOpen: isOpen }),
    setTagPopupTimestamp: (ts) => set({ tagPopupTimestamp: ts }),
    setTagPopupText: (text) => set({ tagPopupText: text }),
    resetTagOffsetPopup: () =>
        set({
            tagPopupOpen: false,
            tagPopupTimestamp: 0,
            tagPopupText: "",
        }),
});
