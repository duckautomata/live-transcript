import { LineMenuSlice, AppSliceCreator } from "./types";

export const createLineMenuSlice: AppSliceCreator<LineMenuSlice> = (set) => ({
    lineMenuId: -1,
    setLineMenuId: (id) => set({ lineMenuId: id }),
});
