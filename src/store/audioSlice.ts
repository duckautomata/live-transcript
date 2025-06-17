import { AudioSlice, AppSliceCreator } from "./types";

export const createAudioSlice: AppSliceCreator<AudioSlice> = (set) => ({
    audioId: -1,
    setAudioId: (id) => set({ audioId: id }),
});
