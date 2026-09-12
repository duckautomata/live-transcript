/**
 * A small Discord-markdown renderer for the notification preview: enough to
 * show what a message will look like, on top of HTML-escaped text so nothing
 * a template says can become markup. The output is an HTML string meant for
 * a container the preview owns.
 */

/**
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * "in 2 hours" / "5 minutes ago" for a unix time, the way Discord's `R`
 * timestamp style reads.
 * @param {number} unix
 * @param {number} [nowMs]
 * @returns {string}
 */
export function relativeTime(unix, nowMs = Date.now()) {
    const diff = unix - Math.floor(nowMs / 1000);
    const abs = Math.abs(diff);
    let s;
    if (abs < 60) s = plural(abs, "second");
    else if (abs < 3600) s = plural(Math.round(abs / 60), "minute");
    else if (abs < 86400) s = plural(Math.round(abs / 3600), "hour");
    else s = plural(Math.round(abs / 86400), "day");
    return diff >= 0 ? `in ${s}` : `${s} ago`;
}

/**
 * @param {number} n
 * @param {string} word
 * @returns {string}
 */
export function plural(n, word) {
    return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Render a Discord `<t:unix:style>` timestamp the way Discord shows it.
 * @param {number} unix
 * @param {string} style - t, T, d, D, f, F or R
 * @param {number} [nowMs]
 * @returns {string}
 */
export function discordTimestamp(unix, style, nowMs = Date.now()) {
    const d = new Date(unix * 1000);
    switch (style) {
        case "R":
            return relativeTime(unix, nowMs);
        case "t":
            return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        case "T":
            return d.toLocaleTimeString();
        case "d":
            return d.toLocaleDateString();
        case "D":
            return d.toLocaleDateString(undefined, { dateStyle: "long" });
        case "F":
            return d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
        default:
            return d.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
    }
}

/**
 * Render message text to preview HTML.
 * @param {string} text
 * @param {number} [nowMs] - for relative timestamps; defaults to now
 * @returns {string} escaped HTML
 */
export function renderDiscordMarkdown(text, nowMs = Date.now()) {
    // Escaped first, so nothing in the text is markup. Links are then parked
    // as placeholders while the inline rules run, so no rule can rewrite the
    // inside of an href; their labels get the inline rules on their own.
    let s = escapeHtml(String(text ?? "").replace(/\0/g, ""));
    const parked = [];
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, label, href) => {
        parked.push(`<a href="${href}" target="_blank" rel="noopener">${inline(label, nowMs)}</a>`);
        return `\0${parked.length - 1}\0`;
    });
    s = inline(s, nowMs);
    s = s.replace(/\0(\d+)\0/g, (_m, i) => parked[Number(i)]);
    return s.replace(/\n/g, "<br />");
}

/** The inline rules: emphasis, code, mentions and timestamps over escaped text. */
function inline(s, nowMs) {
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_\n]+)__/g, "<u>$1</u>");
    s = s.replace(/~~([^~\n]+)~~/g, "<s>$1</s>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="dc-mention">@role $1</span>');
    s = s.replace(/&lt;@!?(\d+)&gt;/g, '<span class="dc-mention">@user $1</span>');
    s = s.replace(/&lt;#(\d+)&gt;/g, '<span class="dc-mention">#channel $1</span>');
    s = s.replace(/(^|\s)@(everyone|here)\b/g, '$1<span class="dc-mention">@$2</span>');
    s = s.replace(/&lt;t:(\d+)(?::([tTdDfFR]))?&gt;/g, (_m, unix, style) => {
        return `<span class="dc-timestamp">${escapeHtml(discordTimestamp(Number(unix), style || "f", nowMs))}</span>`;
    });
    return s;
}
