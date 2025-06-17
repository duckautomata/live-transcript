import { ServerSlice, AppSliceCreator } from "./types";

export const createServerSlice: AppSliceCreator<ServerSlice> = (set) => ({
    serverStatus: "connecting",
    setServerStatus: (status) => set({ serverStatus: status }),
});
