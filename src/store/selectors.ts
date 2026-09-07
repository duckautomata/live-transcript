import { AppStore, StreamInfo, TranscriptLine } from "./types";

/**
 * Selectors for the stream on screen: the past stream picked in the title dropdown when there is one,
 * otherwise the live stream. Each returns a primitive or an existing store reference, so they are safe to
 * use directly with `useAppStore` (a fresh object per call would re-render on every store update).
 */

const findViewedStream = (state: AppStore): StreamInfo | undefined =>
    state.pastStreamViewing ? state.pastStreams.find((s) => s.streamId === state.pastStreamViewing) : undefined;

export const selectActiveTranscript = (state: AppStore): TranscriptLine[] =>
    state.pastStreamViewing ? state.pastStreamTranscript : state.transcript;

export const selectActiveStreamId = (state: AppStore): string => state.pastStreamViewing || state.streamId;

export const selectActiveMediaType = (state: AppStore): AppStore["mediaType"] =>
    state.pastStreamViewing ? (findViewedStream(state)?.mediaType ?? "none") : state.mediaType;

export const selectActiveStartTime = (state: AppStore): number =>
    state.pastStreamViewing ? (findViewedStream(state)?.startTime ?? 0) : state.startTime;

export const selectActiveIsLive = (state: AppStore): boolean =>
    state.pastStreamViewing ? (findViewedStream(state)?.isLive ?? false) : state.isLive;
