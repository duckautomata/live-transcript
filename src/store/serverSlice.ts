import { ServerSlice, AppSliceCreator } from "./types";

export const createServerSlice: AppSliceCreator<ServerSlice> = (set) => ({
    serverStatus: "connecting",
    isSynced: false,
    setServerStatus: (status) => set({ serverStatus: status }),
    setIsSynced: (isSynced) => set({ isSynced: isSynced }),
});
