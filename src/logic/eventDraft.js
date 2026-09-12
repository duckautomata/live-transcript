/**
 * The editor's draft of a notification event, as a small standalone store.
 *
 * Why a store and not component state: the editor is twenty-odd inputs and a
 * server-rendered preview. With everything in one component's state, every
 * keystroke re-rendered all of it, which is what made typing feel slow. With
 * a store, each input subscribes to its own field and the preview to a
 * debounced copy of the whole draft, so a keystroke re-renders one input.
 *
 * Why it persists: the draft is written to session storage on every change
 * and restored when the same event is opened again in the same tab, so
 * switching browser tabs, a page refresh, or the list reloading behind the
 * editor never loses what was typed. Saving or discarding clears it.
 */

import { createStore } from "zustand/vanilla";
import { defaultEventName, fieldProblems, newEvent } from "./notifications";

const KEY_PREFIX = "lt-event-draft:";

/**
 * Storage key for a draft: one per account, channel and event; new events
 * share "new". The account is part of the key so another account signing in
 * on the same tab never sees a stranger's draft (webhook URLs included).
 * @param {string} owner - the account's username
 * @param {string} channel
 * @param {number | string} [eventId]
 */
export const draftKey = (owner, channel, eventId) => `${KEY_PREFIX}${owner || ""}:${channel}:${eventId || "new"}`;

/** The storage drafts live in; session storage is per tab, which is the scope a draft belongs to. */
function defaultStorage() {
    try {
        return typeof sessionStorage === "undefined" ? null : sessionStorage;
    } catch {
        return null;
    }
}

/** Whether a stored draft is waiting to be continued. */
export function hasStoredDraft(owner, channel, eventId, storage = defaultStorage()) {
    if (!storage) return false;
    try {
        return storage.getItem(draftKey(owner, channel, eventId)) !== null;
    } catch {
        return false;
    }
}

/** Forget every stored draft (on sign-out: another account in this tab must not see them). */
export function clearStoredDrafts(storage = defaultStorage()) {
    if (!storage) return;
    try {
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i);
            if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
        }
        keys.forEach((k) => storage.removeItem(k));
    } catch {
        // Nothing to clear, or storage is blocked.
    }
}

let nextRowId = 1;
/** A blank webhook row. rowId is client-only: it keys the row's inputs so removing one never hands its DOM to the next. */
const EMPTY_HOOK = () => ({ name: "", url: "", rowId: nextRowId++ });
const NO_PROBLEMS = { list: [], byPath: {} };

/**
 * Normalise an event as loaded so the editor always has the fields it binds
 * to: an embed object, at least one (possibly blank) webhook row, a trigger
 * list. Rows that already carry ids (a restored draft) keep them, and the
 * counter moves past them so new rows never collide.
 * @param {object} ev
 */
export function normalizeDraft(ev) {
    const d = structuredClone(ev);
    if (!d.embed) d.embed = {};
    if (!Array.isArray(d.triggers)) d.triggers = [];
    if (!Array.isArray(d.webhooks) || d.webhooks.length === 0) d.webhooks = [EMPTY_HOOK()];
    for (const h of d.webhooks) if (h.rowId >= nextRowId) nextRowId = h.rowId + 1;
    d.webhooks = d.webhooks.map((h) => (h.rowId ? h : { ...h, rowId: nextRowId++ }));
    if (typeof d.content !== "string") d.content = "";
    return d;
}

/**
 * The fields the editor can change, as JSON. Two drafts are "the same" when
 * these match; the delivery counters and timestamps the server also sends
 * are not part of it, so a stored draft is not thrown away just because the
 * event fired while it was being written.
 * @param {object} ev
 */
export function editableJson(ev) {
    const c = cleanedEvent(ev);
    return JSON.stringify({
        name: c.name,
        enabled: Boolean(c.enabled),
        webhooks: c.webhooks,
        triggers: c.triggers || [],
        content: c.content || "",
        embedEnabled: Boolean(c.embedEnabled),
        embed: c.embed || {},
        cooldownSeconds: c.cooldownSeconds,
    });
}

/**
 * Create the store for one editing session.
 * @param {object} opts
 * @param {string} opts.owner - the account's username
 * @param {string} opts.channel
 * @param {object | null} opts.event - the saved event to edit, or null for a new one
 * @param {object} opts.defaults - the server's defaults for a new event
 * @param {object} opts.limits - the server's limits, for validation
 * @param {string[]} opts.triggerOrder - trigger ids in the server's order
 * @param {Storage | null} [opts.storage] - where drafts persist (session storage by default; null disables)
 */
export function createDraftStore({
    owner,
    channel,
    event,
    defaults,
    limits,
    triggerOrder,
    storage = defaultStorage(),
}) {
    const key = draftKey(owner, channel, event && event.id);
    const base = normalizeDraft(event || { ...newEvent(defaults), name: defaultEventName(["live"]) });
    const baseJson = editableJson(base);
    const same = (draft) => editableJson(draft) === baseJson;

    // A stored draft is only worth restoring if it was started from the same
    // saved version of the event; otherwise it would silently undo someone
    // else's edit.
    let restored = null;
    let restoredNameTouched = false;
    if (storage) {
        try {
            const raw = storage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : null;
            if (parsed && parsed.base === baseJson && parsed.draft && !same(parsed.draft)) {
                restored = normalizeDraft(parsed.draft);
                restoredNameTouched = Boolean(parsed.nameTouched);
            }
        } catch {
            restored = null;
        }
    }

    const initial = restored || base;
    const store = createStore((set, get) => {
        /** Apply a draft change, keeping the problem list current once a save has been attempted. */
        const change = (fn) =>
            set((s) => {
                const next = fn(s);
                if (next.draft && next.draft !== s.draft) {
                    next.dirty = !same(next.draft);
                    if (s.submitted) {
                        next.problems = fieldProblems(next.draft, limits, { needWebhooks: s.needWebhooks });
                    }
                }
                return next;
            });
        return {
            owner,
            channel,
            eventId: (event && event.id) || 0,
            isNew: !event,
            draft: initial,
            /** JSON of the editable fields as loaded from the server; the dirty check compares against it. */
            snapshot: baseJson,
            /** True when the draft came back from storage rather than the server. */
            restored: Boolean(restored),
            /** Whether anything differs from what was loaded; kept current by every change. */
            dirty: Boolean(restored),
            /** Until the owner types a name, a new event's name follows its triggers. */
            nameTouched: Boolean(event) || restoredNameTouched,
            previewTrigger: (initial.triggers || [])[0] || triggerOrder[0] || "live",
            /** Set by the first save attempt; from then on problems track every change. */
            submitted: false,
            needWebhooks: true,
            problems: NO_PROBLEMS,

            /** Patch top-level fields. */
            set: (patch) => change((s) => ({ draft: { ...s.draft, ...patch } })),
            /** The name field: typing in it stops the automatic naming. */
            setName: (name) => change((s) => ({ draft: { ...s.draft, name }, nameTouched: true })),
            /** Patch embed fields. */
            setEmbed: (patch) => change((s) => ({ draft: { ...s.draft, embed: { ...s.draft.embed, ...patch } } })),
            setWebhook: (i, patch) =>
                change((s) => {
                    const webhooks = s.draft.webhooks.slice();
                    webhooks[i] = { ...webhooks[i], ...patch };
                    return { draft: { ...s.draft, webhooks } };
                }),
            addWebhook: () => change((s) => ({ draft: { ...s.draft, webhooks: [...s.draft.webhooks, EMPTY_HOOK()] } })),
            removeWebhook: (i) =>
                change((s) => {
                    const webhooks = s.draft.webhooks.filter((_, j) => j !== i);
                    return { draft: { ...s.draft, webhooks: webhooks.length ? webhooks : [EMPTY_HOOK()] } };
                }),
            /** Toggle a trigger, keeping the server's order and the automatic name in step. */
            toggleTrigger: (id) =>
                change((s) => {
                    const has = s.draft.triggers.includes(id);
                    const triggers = triggerOrder.filter((t) => (t === id ? !has : s.draft.triggers.includes(t)));
                    const previewTrigger = triggers.includes(s.previewTrigger) ? s.previewTrigger : triggers[0] || id;
                    const name = s.nameTouched ? s.draft.name : defaultEventName(triggers);
                    return { draft: { ...s.draft, triggers, name }, previewTrigger };
                }),
            setPreviewTrigger: (previewTrigger) => set({ previewTrigger }),
            /** Put the embed back to the server's default look. */
            resetEmbed: () =>
                change((s) => ({ draft: { ...s.draft, embedEnabled: true, embed: { ...defaults.embed } } })),
            /**
             * Check the draft before a save or a test; problems stay attached to
             * their fields until they are fixed.
             * @returns {boolean} whether it is fine
             */
            validate: ({ needWebhooks = true } = {}) => {
                const problems = fieldProblems(get().draft, limits, { needWebhooks });
                set({ problems, submitted: true, needWebhooks });
                return problems.list.length === 0;
            },
            /** Whether anything differs from what was loaded. */
            isDirty: () => get().dirty,
            /** Throw the draft away: back to the saved event, storage cleared. */
            discard: () => {
                set({
                    draft: base,
                    dirty: false,
                    restored: false,
                    nameTouched: Boolean(event),
                    submitted: false,
                    problems: NO_PROBLEMS,
                });
                if (storage) storage.removeItem(key);
            },
            /** After a successful save nothing is pending any more. */
            clearStorage: () => {
                if (storage) storage.removeItem(key);
            },
        };
    });

    if (storage) {
        store.subscribe((s, prev) => {
            if (s.draft === prev.draft) return;
            try {
                if (same(s.draft)) storage.removeItem(key);
                else {
                    storage.setItem(
                        key,
                        JSON.stringify({ base: baseJson, draft: s.draft, nameTouched: s.nameTouched, at: Date.now() }),
                    );
                }
            } catch {
                // Storage full or blocked: the draft still lives in memory.
            }
        });
    }
    return store;
}

/**
 * The event a draft would actually save: rows with nothing typed are dropped,
 * and the client-only row ids with them.
 * @param {object} draft
 */
export function cleanedEvent(draft) {
    return {
        ...draft,
        name: (draft.name || "").trim(),
        webhooks: (draft.webhooks || [])
            .map((h) => ({ name: (h.name || "").trim(), url: (h.url || "").trim() }))
            .filter((h) => h.url || h.name),
    };
}

/**
 * Whether the draft's extras differ from the defaults, which is when the
 * editor opens its "more" section on its own.
 * @param {object} draft
 * @param {object} defaults - the server's defaults for a new event
 */
export function hasCustomExtras(draft, defaults) {
    const e = draft.embed || {};
    const d = (defaults && defaults.embed) || {};
    return (
        (e.image || "") !== (d.image || "") ||
        (e.thumbnail || "") !== (d.thumbnail || "") ||
        (e.footer || "") !== (d.footer || "") ||
        Boolean(e.timestamp) !== Boolean(d.timestamp)
    );
}

/**
 * Subscribe to a store's draft with a trailing debounce: `fn` gets the
 * draft once typing pauses for `ms`. Returns the unsubscribe function.
 * @param {import("zustand/vanilla").StoreApi<any>} store
 * @param {(draft: object, previewTrigger: string) => void} fn
 * @param {number} ms
 */
export function subscribeDebounced(store, fn, ms) {
    let timer = null;
    const unsub = store.subscribe((s, prev) => {
        if (s.draft === prev.draft && s.previewTrigger === prev.previewTrigger) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            const cur = store.getState();
            fn(cur.draft, cur.previewTrigger);
        }, ms);
    });
    return () => {
        if (timer) clearTimeout(timer);
        unsub();
    };
}
