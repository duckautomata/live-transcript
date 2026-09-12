import { useCallback, useEffect, useState } from "react";
import { ApiError, errorMessage, notificationsApi } from "../../logic/api";
import { subscribeDebounced } from "../../logic/eventDraft";
import { useAppStore } from "../../store/store";

/** How long typing must pause before the server is asked to render again. */
export const PREVIEW_DEBOUNCE_MS = 350;
/** How long a render may take before the preview admits it is updating. */
const PENDING_AFTER_MS = 500;

/**
 * The server's rendering of a draft store's current draft, re-rendered once
 * typing pauses and only when something the server renders has changed. The
 * last good preview stays on screen while the next one is fetched, so
 * nothing flickers; `pending` only turns on when the server is slow. A 401
 * is reported as `expired` rather than signing the account out, so the draft
 * survives an idle session, and a fresh sign-in renders again on its own.
 * @param {import("zustand/vanilla").StoreApi<any>} store - the draft store
 * @param {string} channel
 * @returns {{preview: object | null, error: string, pending: boolean, expired: boolean, retry: () => void}}
 */
export function usePreview(store, channel) {
    const token = useAppStore((state) => state.accountToken);
    const [state, setState] = useState({ preview: null, error: "", pending: false, expired: false });
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    useEffect(() => {
        if (!token) return undefined;
        let controller = null;
        let pendingTimer = null;
        let lastKey = null;
        const render = async (draft, trigger) => {
            // Only what the server renders matters: a new name, webhook or gap
            // changes nothing in the message, so it costs no request.
            const key = JSON.stringify([draft.content, draft.embedEnabled, draft.embed, trigger]);
            if (key === lastKey) return;
            lastKey = key;
            if (controller) controller.abort();
            const mine = new AbortController();
            controller = mine;
            if (pendingTimer) clearTimeout(pendingTimer);
            pendingTimer = setTimeout(
                () => setState((s) => (s.pending ? s : { ...s, pending: true })),
                PENDING_AFTER_MS,
            );
            try {
                // The server renders the message; it has no use for the webhooks,
                // so the secrets stay off the wire.
                const res = await notificationsApi.preview(channel, { ...draft, webhooks: [] }, trigger, mine.signal);
                if (mine.signal.aborted) return;
                setState({ preview: res, error: "", pending: false, expired: false });
            } catch (err) {
                if (mine.signal.aborted || (err && err.name === "AbortError")) return;
                // A failed render may be retried by the next change.
                lastKey = null;
                const expired = err instanceof ApiError && err.status === 401;
                setState((s) => ({ ...s, error: expired ? "" : errorMessage(err), pending: false, expired }));
            } finally {
                if (controller === mine && pendingTimer) {
                    clearTimeout(pendingTimer);
                    pendingTimer = null;
                }
            }
        };
        const { draft, previewTrigger } = store.getState();
        render(draft, previewTrigger);
        const unsubscribe = subscribeDebounced(store, render, PREVIEW_DEBOUNCE_MS);
        return () => {
            unsubscribe();
            if (controller) controller.abort();
            if (pendingTimer) clearTimeout(pendingTimer);
        };
    }, [store, channel, attempt, token]);

    return { ...state, retry };
}
