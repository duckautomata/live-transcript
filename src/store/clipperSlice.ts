import { ClipperSlice, AppSliceCreator } from "./types";

export const createClipperSlice: AppSliceCreator<ClipperSlice> = (set) => ({
    clipPopupOpen: false,
    clipStartIndex: -1,
    clipEndIndex: -1,
    setClipPopupOpen: (isOpen) => set({ clipPopupOpen: isOpen }),
    setClipStartIndex: (index) => set({ clipStartIndex: index }),
    setClipEndIndex: (index) => set({ clipEndIndex: index }),
});
