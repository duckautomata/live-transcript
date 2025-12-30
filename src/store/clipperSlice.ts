import { ClipperSlice, AppSliceCreator } from "./types";
import { maxClipSize } from "../config";

export const createClipperSlice: AppSliceCreator<ClipperSlice> = (set, get) => ({
    clipPopupOpen: false,
    clipStartIndex: -1,
    clipEndIndex: -1,
    clipInvalidBefore: -1,
    clipInvalidAfter: Number.MAX_SAFE_INTEGER,
    setClipPopupOpen: (isOpen) => {
        set({
            clipPopupOpen: isOpen,
            // Reset bounds when opening/closing if needed, but mostly relevant during clipping
        });
    },
    setClipStartIndex: (index) => {
        const state = get();
        const { transcript, mediaType } = state;

        let before = -1;
        let after = Number.MAX_SAFE_INTEGER;

        if (mediaType !== "none" && index !== -1) {
            const startLineIndex = transcript.findIndex((l) => l.id === index);

            if (startLineIndex !== -1) {
                // Search backwards
                // Limit search to maxClipSize
                const startSearchBefore = Math.max(0, startLineIndex - maxClipSize);
                for (let i = startLineIndex - 1; i >= startSearchBefore; i--) {
                    if (transcript[i].mediaAvailable === false) {
                        before = transcript[i].id;
                        break;
                    }
                }

                // Search forwards
                // Limit search to maxClipSize
                const endSearchAfter = Math.min(transcript.length, startLineIndex + maxClipSize + 1);
                for (let i = startLineIndex + 1; i < endSearchAfter; i++) {
                    if (transcript[i].mediaAvailable === false) {
                        after = transcript[i].id;
                        break;
                    }
                }
            }
        }

        set({
            clipStartIndex: index,
            clipInvalidBefore: before,
            clipInvalidAfter: after,
        });
    },
    setClipEndIndex: (index) => set({ clipEndIndex: index }),
    recalculateClipRange: () => {
        const state = get();
        const { clipStartIndex } = state;
        state.setClipStartIndex(clipStartIndex);
    },
});
