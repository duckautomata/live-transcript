/**
 * Pure helpers for the Notifications page: validation the editor runs before
 * the server does, labels, and the notes that explain a preview.
 */

import { relativeTime } from "./discordMarkdown";

/** "5 minutes ago" for a unix time. */
export const ago = (unix) => relativeTime(unix);

/** Mirrors the server's webhook pattern exactly, so the inline check and the save never disagree. */
export const WEBHOOK_RE =
    /^https:\/\/((ptb|canary)\.)?discord(app)?\.com\/api\/(v\d+\/)?webhooks\/\d{5,30}\/[\w-]{20,200}(\?thread_id=\d{5,30})?$/;

export const TRIGGER_SHORT = { live: "Live", scheduled: "Scheduled", upload: "Upload", short: "Short" };

/** How a webhook is referred to outside its own input: never with the token. */
export function maskWebhook(url) {
    const m = /webhooks\/(\d+)\//.exec(url || "");
    return m ? `webhook ${m[1]}` : "webhook (unrecognised URL)";
}

/**
 * "30m between pings" for a cooldown in seconds.
 * @param {number} seconds
 */
export function humanGap(seconds) {
    seconds = Number(seconds) || 0;
    if (seconds <= 0) return "no minimum gap";
    if (seconds % 3600 === 0) return `${seconds / 3600}h between pings`;
    if (seconds % 60 === 0) return `${seconds / 60}m between pings`;
    return `${seconds}s between pings`;
}

/**
 * The unit (in seconds) a cooldown is most naturally edited in.
 * @param {number} seconds
 * @returns {1 | 60 | 3600}
 */
export function unitFor(seconds) {
    if (seconds > 0 && seconds % 3600 === 0) return 3600;
    if (seconds > 0 && seconds % 60 === 0) return 60;
    return seconds > 0 ? 1 : 60;
}

/**
 * A link needs text. A detection that has no title on record is shown by
 * where it lives rather than by a bare id.
 * @param {string} url
 */
export function urlLabel(url) {
    return String(url || "").replace(/^https?:\/\/(www\.)?/, "");
}

/**
 * A fresh event with the server's defaults.
 * @param {{content: string, embedEnabled: boolean, embed: object, cooldownSeconds: number}} defaults
 */
export function newEvent(defaults) {
    return {
        id: 0,
        name: "",
        enabled: true,
        webhooks: [{ name: "", url: "" }],
        triggers: ["live"],
        content: defaults.content,
        embedEnabled: defaults.embedEnabled,
        embed: { ...defaults.embed },
        cooldownSeconds: defaults.cooldownSeconds,
    };
}

/**
 * The problems with a draft, each attached to the field it belongs to, in
 * the order the form shows them. An empty list means the server will accept
 * it (the server checks again regardless).
 * @param {object} ev
 * @param {object} limits - NotificationLimits from the server
 * @param {{needWebhooks?: boolean}} [opts] - a preview or test does not need webhooks
 * @returns {{list: string[], byPath: Record<string, string>}} byPath keys: name, triggers,
 *   webhooks, webhooks.<i>.url, content, embed.title, embed.description, embed.footer, embed.color, cooldownSeconds
 */
export function fieldProblems(ev, limits, { needWebhooks = true } = {}) {
    const list = [];
    const byPath = {};
    const add = (path, message) => {
        list.push(message);
        if (!byPath[path]) byPath[path] = message;
    };

    const name = (ev.name || "").trim();
    if (!name) add("name", "Give the event a name.");
    else if (name.length > limits.name) add("name", `The name is longer than ${limits.name} characters.`);

    if (!ev.triggers || ev.triggers.length === 0) add("triggers", "Pick at least one trigger.");

    const hooks = (ev.webhooks || []).filter((h) => (h.url || "").trim() || (h.name || "").trim());
    if (needWebhooks && hooks.length === 0) add("webhooks", "Add at least one Discord webhook.");
    if (hooks.length > limits.webhooks) add("webhooks", `At most ${limits.webhooks} webhooks per event.`);
    (ev.webhooks || []).forEach((h, i) => {
        const filled = (h.url || "").trim() || (h.name || "").trim();
        if (filled && !WEBHOOK_RE.test((h.url || "").trim())) {
            const n = hooks.indexOf(h) + 1;
            add(`webhooks.${i}.url`, `Webhook ${n} is not a Discord webhook URL (https://discord.com/api/webhooks/…).`);
        }
    });

    const content = ev.content || "";
    if (content.length > limits.content) add("content", `The message is longer than ${limits.content} characters.`);
    if (!ev.embedEnabled && !content.trim()) add("content", "With the embed off, the message needs some text.");

    if (ev.embedEnabled) {
        const e = ev.embed || {};
        if ((e.title || "").length > limits.embedTitle)
            add("embed.title", `The embed title is longer than ${limits.embedTitle} characters.`);
        if ((e.description || "").length > limits.embedDescription) {
            add("embed.description", `The embed description is longer than ${limits.embedDescription} characters.`);
        }
        if ((e.footer || "").length > limits.embedFooter)
            add("embed.footer", `The embed footer is longer than ${limits.embedFooter} characters.`);
        if (e.color && !/^#[0-9a-fA-F]{6}$/.test(e.color.trim()))
            add("embed.color", "The embed color must look like #2ECC71.");
    }

    const cooldown = Number(ev.cooldownSeconds);
    if (!Number.isFinite(cooldown)) add("cooldownSeconds", "Enter a number for the minimum gap.");
    else if (cooldown < 0) add("cooldownSeconds", "The minimum gap cannot be negative.");
    else if (cooldown > limits.cooldownSeconds)
        add("cooldownSeconds", `The minimum gap is longer than ${limits.cooldownSeconds / 86400} days.`);
    return { list, byPath };
}

/**
 * The problems with a draft as a flat list; see fieldProblems.
 * @param {object} ev
 * @param {object} limits
 * @param {{needWebhooks?: boolean}} [opts]
 * @returns {string[]}
 */
export function validateEvent(ev, limits, opts) {
    return fieldProblems(ev, limits, opts).list;
}

/** The minimum-gap choices offered before "Custom"; values in seconds. */
export const COOLDOWN_PRESETS = [
    { value: 0, label: "Off" },
    { value: 300, label: "5 minutes" },
    { value: 900, label: "15 minutes" },
    { value: 1800, label: "30 minutes" },
    { value: 3600, label: "1 hour" },
    { value: 10800, label: "3 hours" },
    { value: 21600, label: "6 hours" },
    { value: 43200, label: "12 hours" },
    { value: 86400, label: "1 day" },
];

/**
 * The preset a cooldown matches, or "custom".
 * @param {number} seconds
 * @returns {number | "custom"}
 */
export function cooldownPreset(seconds) {
    const n = Number(seconds) || 0;
    return COOLDOWN_PRESETS.some((p) => p.value === n) ? n : "custom";
}

/**
 * The name a new event gets until its owner types one: "Live pings",
 * "Live + Upload pings".
 * @param {string[]} triggers
 */
export function defaultEventName(triggers) {
    const parts = (triggers || []).map((t) => TRIGGER_SHORT[t] || t);
    return parts.length ? `${parts.join(" + ")} pings` : "New event";
}

/**
 * The two short lines under the preview: where the rendering came from, and
 * which of its details are examples (empty when none are).
 * @param {object} s - the preview's `sample`
 * @param {boolean} mockedImage - whether the page drew an example frame
 * @returns {{line: string, example: string}}
 */
export function previewNoteShort(s, mockedImage) {
    if (s.source === "sample") {
        return { line: "Rendered from a stand-in video (local build only).", example: "" };
    }
    if (s.source === "none") {
        return { line: "Nothing detected for this trigger yet, so the details are blank.", example: "" };
    }
    const line = "Rendered by the server from the most recent detection, exactly as it would be posted.";
    let example = "";
    if (s.exampleTitle && mockedImage) example = "The title and image are examples: the stream is offline.";
    else if (mockedImage) example = "The image is an example: Twitch only serves one while the stream is live.";
    else if (s.exampleTitle) example = "The title is an example: none was recorded for that stream.";
    else if (!s.title) example = "No title was recorded for that stream, so {title} is blank.";
    return { line, example };
}

/**
 * The one-line summary under an event's name in the list: where it posts,
 * how often it may, and what it has done.
 * @param {object} ev
 */
export function eventSummary(ev) {
    const hooks = ev.webhooks || [];
    const where = hooks.length ? hooks.map((h) => h.name || maskWebhook(h.url)).join(", ") : "no webhooks";
    const gap =
        Number(ev.cooldownSeconds) > 0 ? humanGap(ev.cooldownSeconds).replace(" between pings", " gap") : "no gap";
    const sent = ev.sentCount ? `sent ${ev.sentCount}×, last ${ago(ev.lastSentAt)}` : "never sent";
    return `${where} · ${gap} · ${sent}`;
}

/**
 * Where a preview's details came from, and which of them are examples.
 * @param {object} s - the preview's `sample`
 * @param {boolean} mockedImage - whether the page drew an example frame
 * @returns {string}
 */
export function previewNote(s, mockedImage) {
    if (s.source === "sample") {
        return "Rendered by the server from a stand-in video, because this is a local build and nothing has been detected for this trigger yet. A deployed server never shows it: with nothing detected, the details are simply blank.";
    }
    if (s.source === "none") {
        return "Rendered by the server. Nothing has been detected for this trigger on this channel yet, so the stream details are blank; they fill in from the first real detection.";
    }
    const parts = [
        "Rendered by the server from the channel's most recent detection, so this is exactly what would be posted. Pings are shown as they would appear.",
    ];
    if (s.exampleTitle && mockedImage) {
        parts.push(
            "That stream is offline, so the title and the preview image are examples: no title was recorded for it, and Twitch only serves a preview frame while a channel is live. The real ones take their place in the announcement.",
        );
    } else if (mockedImage) {
        parts.push(
            "That stream is offline, so the preview image is an example: Twitch only serves a frame while a channel is live, and the real one takes its place in the announcement.",
        );
    } else if (s.exampleTitle) {
        parts.push(
            "No title was recorded for that stream, so the title is an example; the real one takes its place in the announcement.",
        );
    } else if (!s.title) {
        parts.push("No title was recorded for it, so {title} is blank here.");
    }
    return parts.join(" ");
}

/** Whether an embed image URL is the Twitch preview slot the page draws an example frame for. */
export const TWITCH_PREVIEW_RE = /^https:\/\/static-cdn\.jtvnw\.net\/previews-ttv\//;

/**
 * Whether a preview image is the Twitch slot the page stands in for with an
 * example frame: the stream is offline, so Twitch has no frame to show.
 * @param {string | undefined} url
 * @param {object} sample - the preview's `sample`
 */
export function isExampleImage(url, sample) {
    return !!(sample && sample.exampleImage) && TWITCH_PREVIEW_RE.test(url || "");
}

/**
 * Whether the page will draw an example frame anywhere in a preview.
 * @param {{embed?: object, sample?: object}} preview
 */
export function previewHasExampleImage(preview) {
    if (!preview || !preview.embed) return false;
    const { embed, sample } = preview;
    return (
        isExampleImage(embed.image && embed.image.url, sample) ||
        isExampleImage(embed.thumbnail && embed.thumbnail.url, sample)
    );
}

/**
 * "via twitch-eventsub · detected 3s after start · still live", for a
 * detected broadcast.
 * @param {{mechanism?: string, startedAt?: number, detectedAt?: number, endedAt?: number}} d
 * @param {(unix: number) => string} ago - relative-time formatter
 */
export function detectionMeta(d, ago) {
    const parts = [];
    if (d.mechanism) parts.push(`via ${d.mechanism}`);
    if (d.startedAt && d.detectedAt) {
        const delay = d.detectedAt - d.startedAt;
        parts.push(delay < 0 ? `${-delay}s before the reported start` : `detected ${humanDuration(delay)} after start`);
    }
    parts.push(d.endedAt ? `ended ${ago(d.endedAt)}` : "still live");
    return parts.join(" · ");
}

/**
 * "1m 5s" for a number of seconds.
 * @param {number} s
 */
export function humanDuration(s) {
    s = Math.max(0, Math.round(s));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/**
 * Merge live detections and video detections into one newest-first list.
 * @param {{detections?: object[], videos?: object[]}} status
 * @param {(unix: number) => string} ago
 * @param {number} [limit]
 */
export function detectionItems(status, ago, limit = 25) {
    const items = [];
    for (const d of (status && status.detections) || []) {
        items.push({
            key: `live-${d.platform}-${d.broadcastId}`,
            kind: "live",
            platform: d.platform,
            title: d.title,
            url: d.url,
            id: d.broadcastId,
            at: d.detectedAt,
            meta: detectionMeta(d, ago),
        });
    }
    for (const v of (status && status.videos) || []) {
        const meta =
            v.kind === "scheduled" && v.scheduledAt
                ? `scheduled for ${new Date(v.scheduledAt * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : v.publishedAt
                  ? `published ${ago(v.publishedAt)}`
                  : "";
        items.push({
            key: `${v.kind}-${v.platform}-${v.videoId}`,
            kind: v.kind,
            platform: v.platform,
            title: v.title,
            url: v.url,
            id: v.videoId,
            at: v.detectedAt,
            meta,
        });
    }
    items.sort((a, b) => b.at - a.at);
    return items.slice(0, limit);
}

/**
 * Summarize the detection legs for the status card.
 * @param {{enabled: boolean, state: string, watching: string[]}} status
 * @returns {{label: string, color: "success" | "warning" | "error" | "default", detail: string}}
 */
export function detectionSummary(status) {
    if (!status || !status.enabled) {
        return { label: "Off", color: "default", detail: "Live detection is not running on the server." };
    }
    if (status.state === "unwatched") {
        return {
            label: "Not watched",
            color: "default",
            detail: "Live detection is on, but this channel is not configured for it.",
        };
    }
    const platforms = (status.watching || []).map((p) => (p === "youtube" ? "YouTube" : p === "twitch" ? "Twitch" : p));
    const watching = platforms.length ? `Watching ${platforms.join(" and ")}.` : "";
    switch (status.state) {
        case "ok":
            return {
                label: "Healthy",
                color: "success",
                detail: `Every detection mechanism is working. ${watching}`.trim(),
            };
        case "degraded":
            return {
                label: "Degraded",
                color: "warning",
                detail: `A detection mechanism has gone quiet; the others cover for it. ${watching}`.trim(),
            };
        case "down":
            return {
                label: "Problem",
                color: "error",
                detail: `A detection mechanism is failing; detection may be slower until it recovers. ${watching}`.trim(),
            };
        default:
            return { label: status.state, color: "default", detail: watching };
    }
}

/** "Twitch" / "YouTube" for a platform id. */
export function platformLabel(platform) {
    if (platform === "youtube") return "YouTube";
    if (platform === "twitch") return "Twitch";
    return platform || "";
}

/** Delivery statuses as a color token and a plain word. */
export const DELIVERY_STATUS = {
    sent: { color: "success.main", word: "sent" },
    partial: { color: "warning.main", word: "partial" },
    failed: { color: "error.main", word: "failed" },
    suppressed: { color: "text.disabled", word: "skipped" },
    test: { color: "info.main", word: "test" },
};

/** Plain names for live detection's mechanisms. */
export const LEG_LABELS = {
    "twitch-eventsub": "Twitch push",
    "twitch-poll": "Twitch poll",
    "youtube-websub": "YouTube push",
    "youtube-state-poll": "YouTube state poll",
    "youtube-discovery": "YouTube discovery",
    "youtube-search-audit": "YouTube audit",
};

/** "Twitch push" for a mechanism id. */
export const legLabel = (mechanism) => LEG_LABELS[mechanism] || mechanism;
