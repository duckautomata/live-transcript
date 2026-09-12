import { describe, expect, it, vi } from "vitest";
import {
    cleanedEvent,
    clearStoredDrafts,
    createDraftStore,
    draftKey,
    hasStoredDraft,
    normalizeDraft,
    subscribeDebounced,
} from "./eventDraft";

const defaults = {
    content: "",
    embedEnabled: true,
    embed: { title: "{channel}'s {headline}", description: "**{title}**", url: "{url}", color: "#2ECC71" },
    cooldownSeconds: 300,
};
const order = ["live", "scheduled", "upload", "short"];
const limits = {
    name: 80,
    content: 2000,
    embedTitle: 256,
    embedDescription: 4096,
    embedFooter: 2048,
    webhooks: 10,
    cooldownSeconds: 604800,
    eventsPerChannel: 100,
};

/** A session-storage stand-in. */
function memoryStorage() {
    const m = new Map();
    return {
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => m.set(k, String(v)),
        removeItem: (k) => m.delete(k),
        size: () => m.size,
    };
}

const saved = {
    id: 7,
    name: "Stream pings",
    enabled: true,
    webhooks: [{ name: "#announcements", url: "https://discord.com/api/webhooks/1/x" }],
    triggers: ["live", "upload"],
    content: "hi",
    embedEnabled: true,
    embed: { title: "t" },
    cooldownSeconds: 60,
};

describe("createDraftStore", () => {
    it("starts a new event from the defaults with one blank webhook row", () => {
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        const s = store.getState();
        expect(s.isNew).toBe(true);
        expect(s.draft.name).toBe("Live pings");
        expect(s.nameTouched).toBe(false);
        expect(s.draft.triggers).toEqual(["live"]);
        expect(s.draft.webhooks).toMatchObject([{ name: "", url: "" }]);
        expect(s.draft.webhooks[0].rowId).toBeTruthy();
        expect(s.draft.embed).toEqual(defaults.embed);
        expect(s.isDirty()).toBe(false);
        expect(s.previewTrigger).toBe("live");
    });

    it("edits fields without touching the saved copy, and knows when it is dirty", () => {
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        store.getState().set({ name: "Renamed" });
        expect(store.getState().draft.name).toBe("Renamed");
        expect(saved.name).toBe("Stream pings");
        expect(store.getState().isDirty()).toBe(true);
        expect(store.getState().dirty).toBe(true);
        store.getState().set({ name: "Stream pings" });
        expect(store.getState().isDirty()).toBe(false);
    });

    it("keeps triggers in the server's order and moves the preview trigger off a removed one", () => {
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        store.getState().setPreviewTrigger("upload");
        store.getState().toggleTrigger("scheduled");
        expect(store.getState().draft.triggers).toEqual(["live", "scheduled", "upload"]);
        store.getState().toggleTrigger("upload");
        expect(store.getState().draft.triggers).toEqual(["live", "scheduled"]);
        expect(store.getState().previewTrigger).toBe("live");
    });

    it("manages webhook rows and never leaves the list empty", () => {
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        store.getState().setWebhook(0, { url: "https://discord.com/api/webhooks/1/x" });
        store.getState().addWebhook();
        expect(store.getState().draft.webhooks).toHaveLength(2);
        const ids = store.getState().draft.webhooks.map((h) => h.rowId);
        expect(new Set(ids).size).toBe(2);
        store.getState().removeWebhook(0);
        expect(store.getState().draft.webhooks[0].rowId).toBe(ids[1]);
        store.getState().removeWebhook(0);
        expect(store.getState().draft.webhooks).toMatchObject([{ name: "", url: "" }]);
        expect(store.getState().dirty).toBe(false);
    });

    it("persists edits and restores them for the same saved version", () => {
        const storage = memoryStorage();
        const a = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        a.getState().set({ content: "typed while away" });
        expect(storage.size()).toBe(1);

        const b = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(b.getState().restored).toBe(true);
        expect(b.getState().draft.content).toBe("typed while away");
        expect(b.getState().isDirty()).toBe(true);

        // Edited elsewhere since: the stale draft is dropped rather than restored.
        const c = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: { ...saved, name: "Changed on another device" },
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(c.getState().restored).toBe(false);
        expect(c.getState().draft.content).toBe("hi");
    });

    it("clears storage when the draft returns to the saved state, is discarded, or is saved", () => {
        const storage = memoryStorage();
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        store.getState().set({ name: "x" });
        expect(storage.size()).toBe(1);
        store.getState().set({ name: "Stream pings" });
        expect(storage.size()).toBe(0);

        store.getState().set({ name: "y" });
        store.getState().discard();
        expect(store.getState().draft.name).toBe("Stream pings");
        expect(storage.size()).toBe(0);

        store.getState().set({ name: "z" });
        store.getState().clearStorage();
        expect(storage.size()).toBe(0);
    });

    it("keys drafts per account, channel and event", () => {
        expect(draftKey("doki-fan", "doki", 0)).toBe("lt-event-draft:doki-fan:doki:new");
        expect(draftKey("mod", "mint", 12)).toBe("lt-event-draft:mod:mint:12");
        // Another account on the same tab never sees a stranger's draft.
        const storage = memoryStorage();
        const a = createDraftStore({
            owner: "a",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        a.getState().set({ content: "a's secret webhook goes here" });
        const b = createDraftStore({
            owner: "b",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(b.getState().restored).toBe(false);
        expect(b.getState().draft.content).toBe("");
    });

    it("keeps a stored draft when only the event's delivery counters changed", () => {
        const storage = memoryStorage();
        const a = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        a.getState().set({ content: "half written" });
        // The event fired while the draft was open: counters and timestamps moved, nothing editable did.
        const fired = { ...saved, sentCount: 9, lastSentAt: 1_800_000_000, updatedAt: 1_800_000_000 };
        const b = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: fired,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(b.getState().restored).toBe(true);
        expect(b.getState().draft.content).toBe("half written");
    });

    it("keeps the typed name and fresh row ids across a restore", () => {
        const storage = memoryStorage();
        const a = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        a.getState().setName("Mine");
        a.getState().addWebhook();
        const ids = a.getState().draft.webhooks.map((h) => h.rowId);
        const b = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(b.getState().nameTouched).toBe(true);
        b.getState().toggleTrigger("upload");
        expect(b.getState().draft.name).toBe("Mine");
        b.getState().addWebhook();
        const all = b.getState().draft.webhooks.map((h) => h.rowId);
        expect(all.slice(0, 2)).toEqual(ids);
        expect(new Set(all).size).toBe(3);
    });

    it("survives unreadable storage", () => {
        const storage = memoryStorage();
        storage.setItem(draftKey("doki-fan", "doki", "new"), "{not json");
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(store.getState().restored).toBe(false);
    });
});

describe("automatic naming and validation", () => {
    it("names a new event after its triggers until a name is typed", () => {
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        store.getState().toggleTrigger("upload");
        expect(store.getState().draft.name).toBe("Live + Upload pings");
        store.getState().toggleTrigger("live");
        expect(store.getState().draft.name).toBe("Upload pings");
        store.getState().setName("Mine");
        store.getState().toggleTrigger("live");
        expect(store.getState().draft.name).toBe("Mine");
        // A saved event keeps its own name whatever happens to its triggers.
        const edit = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: saved,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        edit.getState().toggleTrigger("short");
        expect(edit.getState().draft.name).toBe("Stream pings");
    });

    it("attaches problems to fields on validate and keeps them current afterwards", () => {
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        expect(store.getState().problems.list).toEqual([]);
        store.getState().setWebhook(0, { url: "nope" });
        expect(store.getState().validate()).toBe(false);
        const p = store.getState().problems;
        expect(p.byPath["webhooks.0.url"]).toContain("not a Discord webhook URL");
        expect(store.getState().submitted).toBe(true);
        // Fixing the field clears its problem without another validate call.
        store
            .getState()
            .setWebhook(0, { url: "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz" });
        expect(store.getState().problems.list).toEqual([]);
        // Tests do not need webhooks; saves do.
        store.getState().setWebhook(0, { url: "", name: "" });
        expect(store.getState().validate({ needWebhooks: false })).toBe(true);
        expect(store.getState().validate()).toBe(false);
        expect(store.getState().problems.byPath.webhooks).toBe("Add at least one Discord webhook.");
    });

    it("knows which drafts are stored and can forget them all", () => {
        const storage = memoryStorage();
        storage.length = 0;
        storage.key = () => null;
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage,
        });
        expect(hasStoredDraft("doki-fan", "doki", 0, storage)).toBe(false);
        store.getState().set({ content: "x" });
        expect(hasStoredDraft("doki-fan", "doki", 0, storage)).toBe(true);
        expect(hasStoredDraft("doki-fan", "mint", 0, storage)).toBe(false);
        // clearStoredDrafts walks storage like the browser API does.
        const keys = [draftKey("doki-fan", "doki", 0)];
        storage.length = keys.length;
        storage.key = (i) => keys[i] ?? null;
        clearStoredDrafts(storage);
        expect(hasStoredDraft("doki-fan", "doki", 0, storage)).toBe(false);
    });
});

describe("normalizeDraft and cleanedEvent", () => {
    it("fills the fields the editor binds to", () => {
        const d = normalizeDraft({ id: 1, name: "n" });
        expect(d.embed).toEqual({});
        expect(d.triggers).toEqual([]);
        expect(d.webhooks).toMatchObject([{ name: "", url: "" }]);
        expect(d.content).toBe("");
    });
    it("drops blank webhook rows and trims", () => {
        const c = cleanedEvent({
            name: "  Pings ",
            webhooks: [
                { name: " a ", url: " u " },
                { name: "", url: "" },
                { name: "", url: "x" },
            ],
        });
        expect(c.name).toBe("Pings");
        expect(c.webhooks).toEqual([
            { name: "a", url: "u" },
            { name: "", url: "x" },
        ]);
    });
});

describe("subscribeDebounced", () => {
    it("fires once after typing pauses, with the latest draft", () => {
        vi.useFakeTimers();
        const store = createDraftStore({
            owner: "doki-fan",
            channel: "doki",
            event: null,
            defaults,
            limits,
            triggerOrder: order,
            storage: null,
        });
        const fn = vi.fn();
        const unsub = subscribeDebounced(store, fn, 300);
        store.getState().set({ name: "a" });
        vi.advanceTimersByTime(100);
        store.getState().set({ name: "ab" });
        vi.advanceTimersByTime(100);
        store.getState().set({ name: "abc" });
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn.mock.calls[0][0].name).toBe("abc");
        expect(fn.mock.calls[0][1]).toBe("live");
        // A preview trigger change also counts; setting the same value does not.
        store.getState().setPreviewTrigger("upload");
        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn.mock.calls[1][1]).toBe("upload");
        store.getState().setPreviewTrigger("upload");
        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(2);
        unsub();
        store.getState().set({ name: "abcd" });
        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(2);
        vi.useRealTimers();
    });
});
