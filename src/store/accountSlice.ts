import { AccountSlice, AppSliceCreator } from "./types";

/**
 * The signed-in account. The token and the user are persisted (see store.ts)
 * so a visit stays signed in; everything else is per-page.
 */
export const createAccountSlice: AppSliceCreator<AccountSlice> = (set) => ({
    accountToken: "",
    accountUser: null,
    accountNotice: null,
    accountDialogOpen: false,
    setAccountSession: (token, user) => set({ accountToken: token, accountUser: user, accountNotice: null }),
    signOut: (reason) => set({ accountToken: "", accountUser: null, accountNotice: reason ?? null }),
    setAccountDialogOpen: (isOpen) => set({ accountDialogOpen: isOpen }),
    clearAccountNotice: () => set({ accountNotice: null }),
});
