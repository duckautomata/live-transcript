import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AppStore } from "./types";
import { createAudioSlice } from "./audioSlice";
import { createClipperSlice } from "./clipperSlice";
import { createLineMenuSlice } from "./lineMenuSlice";
import { createTagPopupSlice } from "./tagPopupSlice";
import { createServerSlice } from "./serverSlice";
import { createTranscriptSlice } from "./transcriptSlice";
import { createSettingsSlice } from "./settingsSlice";

export const useAppStore = create<AppStore>()(
    persist(
        (set, get, api) => ({
            ...createAudioSlice(set, get, api),
            ...createClipperSlice(set, get, api),
            ...createLineMenuSlice(set, get, api),
            ...createTagPopupSlice(set, get, api),
            ...createServerSlice(set, get, api),
            ...createTranscriptSlice(set, get, api),
            ...createSettingsSlice(set, get, api),
        }),
        {
            name: "live-transcript-settings", // The key in localStorage
            // We only want to persist the 'settings' slice of our state
            partialize: (state) => ({
                theme: state.theme,
                density: state.density,
                timeFormat: state.timeFormat,
                newAtTop: state.newAtTop,
                enableTagHelper: state.enableTagHelper,
                defaultOffset: state.defaultOffset,
                sidebarOpen: state.sidebarOpen,
            }),
        },
    ),
);
