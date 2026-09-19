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
 * What may follow "https://" in the escaped text: anything but whitespace, a
 * parked link, a backtick (so `code` can close) or an escaped angle bracket.
 */
const URL_BODY = "(?:(?!&lt;|&gt;)[^\\s\\0`])+";
const MASKED_LINK = new RegExp(String.raw`\[([^\]]+)\]\((?:(https?://[^)\s]+)|&lt;(https?://${URL_BODY})&gt;)\)`, "g");
const ANGLE_URL = new RegExp(`&lt;(https?://${URL_BODY})&gt;`, "g");
const BARE_URL = new RegExp(`https?://${URL_BODY}`, "g");

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
    const park = (href, label) => {
        parked.push(`<a href="${href}" target="_blank" rel="noopener">${label}</a>`);
        return `\0${parked.length - 1}\0`;
    };
    // Masked links go first, so the address inside one is never linked twice.
    s = s.replace(MASKED_LINK, (_m, label, href, angled) => park(href || angled, inline(label, nowMs)));
    // Discord links every address it sees, and a video description is mostly
    // addresses. <https://…> is the same link with its card suppressed (the
    // server writes platform text that way in the message): the brackets
    // never show. Only http(s) is ever matched, so nothing else can become an href.
    s = s.replace(ANGLE_URL, (m, url, offset, whole) => (inCode(whole, offset) ? m : park(url, url)));
    // Emphasis is counted on a copy of the text in which every address already
    // linked is blanked out (same offsets): the "_" inside an earlier address
    // opens nothing, and must not cost a later one its own trailing "_".
    let seen = s;
    s = s.replace(BARE_URL, (m, offset, whole) => {
        if (inCode(whole, offset)) return m;
        const [url, tail] = splitUrlTail(m, linePrefix(seen, offset));
        // "https://." is punctuation after a bare scheme, not an address.
        if (/^https?:\/\/$/.test(url)) return m;
        seen = seen.slice(0, offset) + " ".repeat(url.length) + seen.slice(offset + url.length);
        return park(url, url) + tail;
    });
    s = inline(s, nowMs);
    s = s.replace(/\0(\d+)\0/g, (_m, i) => parked[Number(i)]);
    return s.replace(/\n/g, "<br />");
}

/** The text between the start of the line and an offset. */
function linePrefix(s, offset) {
    return s.slice(s.lastIndexOf("\n", offset - 1) + 1, offset);
}

/** How many times a marker occurs in a piece of text. */
function occurrences(s, marker) {
    return s.split(marker).length - 1;
}

/**
 * Whether an offset sits inside `code` on its line, where Discord shows an
 * address as written. It looks for real code spans, the same ones inline()
 * renders: a lone backtick - a kaomoji, a backtick typed for an apostrophe -
 * opens nothing, and must not switch off every link after it.
 */
function inCode(s, offset) {
    const start = s.lastIndexOf("\n", offset - 1) + 1;
    const end = s.indexOf("\n", offset);
    const line = s.slice(start, end === -1 ? s.length : end);
    const at = offset - start;
    for (const m of line.matchAll(/`[^`\n]+`/g)) {
        if (at > m.index && at < m.index + m[0].length) return true;
    }
    return false;
}

/**
 * The run of emphasis markers a piece of text ends in. Scanned backwards by
 * hand: a description is someone else's text, and an unanchored /[*_~]+$/ over
 * a long run of markers is quadratic per call, inside a loop.
 */
function trailingEmphasis(s) {
    let i = s.length;
    while (i > 0 && "*_~".includes(s[i - 1])) i -= 1;
    return s.slice(i);
}

/**
 * Split what a bare address matched into the address and the text that only
 * follows it. Sentence punctuation, a quote and a ")" that closes a bracket
 * opened before the address are not part of it ("(see https://a.test/x)."),
 * while "https://en.wikipedia.org/wiki/Foo_(bar)" keeps its own. Emphasis
 * that was opened earlier on the line closes after the address, so
 * **https://a.test** stays a bold link and /__init__ keeps its underscores.
 * The text is escaped, so a quote is an entity and "&amp;" ends in a ";"
 * that belongs to it.
 * @param {string} match - the escaped text the address pattern matched
 * @param {string} before - the rest of its line, up to the match
 * @returns {[string, string]} the address, and the tail left outside the link
 */
function splitUrlTail(match, before) {
    let end = match.length;
    for (;;) {
        const url = match.slice(0, end);
        const quote = /(?:&quot;|&#39;)$/.exec(url);
        const emphasis = trailingEmphasis(url);
        if (quote) end -= quote[0].length;
        else if (url.endsWith("&amp;")) break;
        else if (/[.,;:!?]$/.test(url)) end -= 1;
        else if (url.endsWith(")") && occurrences(url, ")") > occurrences(url, "(")) end -= 1;
        else if (emphasis && occurrences(before, emphasis) % 2 === 1) end -= emphasis.length;
        else break;
    }
    return [match.slice(0, end), match.slice(end)];
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
