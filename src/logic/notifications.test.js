import { describe, expect, it } from "vitest";
import {
    WEBHOOK_RE,
    detectionItems,
    detectionSummary,
    humanDuration,
    humanGap,
    isExampleImage,
    maskWebhook,
    newEvent,
    previewHasExampleImage,
    previewNote,
    unitFor,
    urlLabel,
    validateEvent,
    fieldProblems,
    cooldownPreset,
    defaultEventName,
    previewNoteShort,
    eventSummary,
} from "./notifications";

const limits = {
    name: 80,
    content: 2000,
    embedTitle: 256,
    embedDescription: 4096,
    embedFooter: 2048,
    webhooks: 10,
    cooldownSeconds: 7 * 24 * 60 * 60,
    eventsPerChannel: 100,
};
const hook = "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCD";
const defaults = {
    content: "",
    embedEnabled: true,
    embed: {
        title: "{channel}'s {headline}",
        description: "**{title}**",
        url: "{url}",
        color: "#2ECC71",
        image: "{thumbnail}",
        thumbnail: "",
        footer: "",
        timestamp: true,
    },
    cooldownSeconds: 300,
};

describe("WEBHOOK_RE", () => {
    it("accepts Discord webhook URLs only", () => {
        expect(WEBHOOK_RE.test(hook)).toBe(true);
        expect(
            WEBHOOK_RE.test(
                "https://ptb.discord.com/api/v10/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCD?thread_id=1234567",
            ),
        ).toBe(true);
        expect(
            WEBHOOK_RE.test(
                "https://example.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCD",
            ),
        ).toBe(false);
        expect(
            WEBHOOK_RE.test(
                "http://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCD",
            ),
        ).toBe(false);
        expect(WEBHOOK_RE.test("")).toBe(false);
    });
});

describe("labels", () => {
    it("masks webhooks and labels links", () => {
        expect(maskWebhook(hook)).toBe("webhook 123456789012345678");
        expect(maskWebhook("nope")).toBe("webhook (unrecognised URL)");
        expect(urlLabel("https://www.twitch.tv/dokibird")).toBe("twitch.tv/dokibird");
        expect(urlLabel(undefined)).toBe("");
    });

    it("describes gaps and durations", () => {
        expect(humanGap(0)).toBe("no minimum gap");
        expect(humanGap(1800)).toBe("30m between pings");
        expect(humanGap(7200)).toBe("2h between pings");
        expect(humanGap(90)).toBe("90s between pings");
        expect(unitFor(0)).toBe(60);
        expect(unitFor(7200)).toBe(3600);
        expect(unitFor(90)).toBe(1);
        expect(humanDuration(65)).toBe("1m 5s");
        expect(humanDuration(3600)).toBe("1h 0m");
    });
});

describe("validateEvent", () => {
    const good = () => ({ ...newEvent(defaults), name: "Pings", webhooks: [{ name: "", url: hook }] });

    it("accepts a complete draft", () => {
        expect(validateEvent(good(), limits)).toEqual([]);
    });

    it("lists every problem at once", () => {
        const ev = {
            ...good(),
            name: " ",
            triggers: [],
            webhooks: [{ name: "x", url: "not a url" }],
            cooldownSeconds: -1,
        };
        const problems = validateEvent(ev, limits);
        expect(problems).toEqual([
            "Give the event a name.",
            "Pick at least one trigger.",
            "Webhook 1 is not a Discord webhook URL (https://discord.com/api/webhooks/…).",
            "The minimum gap cannot be negative.",
        ]);
    });

    it("needs webhooks only when saving", () => {
        const ev = { ...good(), webhooks: [{ name: "", url: "" }] };
        expect(validateEvent(ev, limits)).toEqual(["Add at least one Discord webhook."]);
        expect(validateEvent(ev, limits, { needWebhooks: false })).toEqual([]);
    });

    it("refuses an empty message when the embed is off, and a bad color", () => {
        const ev = { ...good(), embedEnabled: false, content: "  " };
        expect(validateEvent(ev, limits)).toEqual(["With the embed off, the message needs some text."]);
        const colored = { ...good(), embed: { ...good().embed, color: "green" } };
        expect(validateEvent(colored, limits)).toEqual(["The embed color must look like #2ECC71."]);
    });
});

describe("preview helpers", () => {
    const twitch = "https://static-cdn.jtvnw.net/previews-ttv/live_user_dokibird-1280x720.jpg?t=1";

    it("only stands in for the Twitch slot of an offline stream", () => {
        expect(isExampleImage(twitch, { exampleImage: true })).toBe(true);
        expect(isExampleImage(twitch, { exampleImage: false })).toBe(false);
        expect(isExampleImage("https://i.ytimg.com/vi/x/maxresdefault.jpg", { exampleImage: true })).toBe(false);
        expect(previewHasExampleImage({ embed: { image: { url: twitch } }, sample: { exampleImage: true } })).toBe(
            true,
        );
        expect(previewHasExampleImage({ embed: {}, sample: { exampleImage: true } })).toBe(false);
        expect(previewHasExampleImage(null)).toBe(false);
    });

    it("explains where the preview came from", () => {
        expect(previewNote({ source: "sample" }, false)).toContain("stand-in video");
        expect(previewNote({ source: "none" }, false)).toContain("Nothing has been detected");
        expect(previewNote({ source: "recent", title: "T" }, false)).not.toContain("blank");
        expect(previewNote({ source: "recent", title: "" }, false)).toContain("{title} is blank");
        expect(previewNote({ source: "recent", title: "", exampleTitle: "Example stream title" }, true)).toContain(
            "title and the preview image are examples",
        );
        expect(previewNote({ source: "recent", title: "T" }, true)).toContain("preview image is an example");
    });
});

describe("detection status", () => {
    it("summarises the legs for people", () => {
        expect(detectionSummary(null).label).toBe("Off");
        expect(detectionSummary({ enabled: true, state: "unwatched", watching: [] }).label).toBe("Not watched");
        const ok = detectionSummary({ enabled: true, state: "ok", watching: ["twitch", "youtube"] });
        expect(ok).toMatchObject({ label: "Healthy", color: "success" });
        expect(ok.detail).toContain("Watching Twitch and YouTube");
        expect(detectionSummary({ enabled: true, state: "down", watching: ["twitch"] }).color).toBe("error");
    });

    it("merges detections newest first", () => {
        const ago = (unix) => `t${unix}`;
        const items = detectionItems(
            {
                detections: [
                    {
                        platform: "twitch",
                        broadcastId: "1",
                        title: "",
                        url: "https://twitch.tv/x",
                        detectedAt: 100,
                        startedAt: 97,
                        mechanism: "twitch-eventsub",
                        endedAt: 0,
                    },
                ],
                videos: [
                    {
                        platform: "youtube",
                        videoId: "v",
                        kind: "short",
                        title: "S",
                        url: "u",
                        detectedAt: 200,
                        publishedAt: 150,
                    },
                ],
            },
            ago,
        );
        expect(items.map((i) => i.kind)).toEqual(["short", "live"]);
        expect(items[1].meta).toBe("via twitch-eventsub · detected 3s after start · still live");
        expect(items[0].meta).toBe("published t150");
    });
});

describe("editor helpers", () => {
    it("maps problems to fields", () => {
        const ev = { ...newEvent(defaults), name: "", webhooks: [{ name: "a", url: "bad" }], triggers: [] };
        const { list, byPath } = fieldProblems(ev, limits);
        expect(byPath.name).toBe("Give the event a name.");
        expect(byPath.triggers).toBe("Pick at least one trigger.");
        expect(byPath["webhooks.0.url"]).toContain("Webhook 1");
        expect(list).toHaveLength(3);
        // A blank row is not a problem, and numbering skips it.
        const two = {
            ...ev,
            name: "n",
            triggers: ["live"],
            webhooks: [
                { name: "", url: "" },
                { name: "", url: "bad" },
            ],
        };
        expect(fieldProblems(two, limits).byPath["webhooks.1.url"]).toContain("Webhook 1");
    });
    it("asks for a number when the custom gap is empty", () => {
        const ev = {
            ...newEvent(defaults),
            name: "n",
            webhooks: [{ name: "", url: hook }],
            cooldownSeconds: Number.NaN,
        };
        expect(fieldProblems(ev, limits).byPath.cooldownSeconds).toBe("Enter a number for the minimum gap.");
    });
    it("knows the cooldown presets", () => {
        expect(cooldownPreset(1800)).toBe(1800);
        expect(cooldownPreset(0)).toBe(0);
        expect(cooldownPreset(1234)).toBe("custom");
    });
    it("names events after triggers", () => {
        expect(defaultEventName(["live"])).toBe("Live pings");
        expect(defaultEventName(["live", "upload"])).toBe("Live + Upload pings");
        expect(defaultEventName([])).toBe("New event");
    });
    it("writes short preview notes", () => {
        expect(previewNoteShort({ source: "sample" }, false).line).toContain("stand-in");
        expect(previewNoteShort({ source: "none" }, false).line).toContain("Nothing detected");
        const recent = previewNoteShort({ source: "recent", title: "T" }, false);
        expect(recent.line).toContain("most recent detection");
        expect(recent.example).toBe("");
        expect(previewNoteShort({ source: "recent", title: "", exampleTitle: "x" }, true).example).toContain(
            "title and image",
        );
        expect(previewNoteShort({ source: "recent", title: "T" }, true).example).toContain("image is an example");
        expect(previewNoteShort({ source: "recent", title: "" }, false).example).toContain("{title} is blank");
    });
    it("summarises an event in one line", () => {
        const ev = {
            webhooks: [
                { name: "#news", url: hook },
                { name: "", url: hook },
            ],
            cooldownSeconds: 1800,
            sentCount: 2,
            lastSentAt: Math.floor(Date.now() / 1000) - 120,
        };
        expect(eventSummary(ev)).toBe("#news, webhook 123456789012345678 · 30m gap · sent 2×, last 2 minutes ago");
        expect(eventSummary({ webhooks: [], cooldownSeconds: 0, sentCount: 0 })).toBe(
            "no webhooks · no gap · never sent",
        );
    });
});
