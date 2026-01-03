import { AppSliceCreator, TagFormatterSlice } from "./types";

export const createTagFormatterSlice: AppSliceCreator<TagFormatterSlice> = (set, get) => ({
    formattedRows: [],
    controls: {},
    inputTags: "",

    setFormattedRows: (rows) => set({ formattedRows: typeof rows === "function" ? rows(get().formattedRows) : rows }),
    setControls: (controls) => set({ controls: typeof controls === "function" ? controls(get().controls) : controls }),
    setInputTags: (tags) => set({ inputTags: tags }),
});
