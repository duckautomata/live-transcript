/**
 * Helpers for the transcript search box: filtering lines and highlighting matches.
 * Kept free of React so it is unit-testable and shared by every transcript view.
 */

/** @typedef {import("../store/types").TranscriptLine} TranscriptLine */
/** @typedef {import("../store/types").Segment} Segment */

/** Text rendered between two segments of a line; the search runs on the same joined text. */
export const SEGMENT_SEPARATOR = " ";

/**
 * Lower-cased searchable text per segment list. A media / vod update replaces the line object but keeps
 * its `segments` array, so keying on the array keeps the cache warm across those updates and lets every
 * keystroke after the first skip the join + toLowerCase for lines it has already seen.
 * @type {WeakMap<object, string>}
 */
const searchTextCache = new WeakMap();

/**
 * Join the text of every segment the way the transcript renders it.
 * @param {Segment[] | undefined} segments
 * @returns {string}
 */
export function joinSegments(segments) {
    if (!segments || segments.length === 0) return "";
    if (segments.length === 1) return segments[0]?.text ?? "";
    let text = "";
    for (let i = 0; i < segments.length; i++) {
        if (i > 0) text += SEGMENT_SEPARATOR;
        text += segments[i]?.text ?? "";
    }
    return text;
}

/**
 * Lower-cased joined text of a segment list, cached per array.
 * @param {Segment[] | undefined} segments
 * @returns {string}
 */
function getSegmentsSearchText(segments) {
    if (!Array.isArray(segments)) return "";
    let cached = searchTextCache.get(segments);
    if (cached === undefined) {
        cached = joinSegments(segments).toLowerCase();
        searchTextCache.set(segments, cached);
    }
    return cached;
}

/**
 * Lower-cased text of a line.
 * @param {TranscriptLine} line
 * @returns {string}
 */
export function getLineSearchText(line) {
    if (line === null || typeof line !== "object") return "";
    return getSegmentsSearchText(line.segments);
}

/**
 * The form of a search term that is actually matched: surrounding whitespace dropped, lower-cased.
 * An empty result means "no filter".
 * @param {string} term
 * @returns {string}
 */
export function normalizeSearchTerm(term) {
    return typeof term === "string" ? term.trim().toLowerCase() : "";
}

/**
 * Lines whose text contains the (case-insensitive) term. Returns the same array when the term is empty
 * so memoized consumers keep their reference.
 * @param {TranscriptLine[]} lines
 * @param {string} term - raw or normalized term
 * @returns {TranscriptLine[]}
 */
export function filterTranscript(lines, term) {
    const needle = normalizeSearchTerm(term);
    if (!needle) return lines;
    return lines.filter((line) => getLineSearchText(line).includes(needle));
}

/**
 * Escape a string so it can be used literally inside a RegExp.
 * @param {string} value
 * @returns {string}
 */
export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Every rendered line highlights the same term, so a single-entry cache turns "one RegExp per line"
// into "one RegExp per keystroke".
let cachedPattern = { term: "", regex: /(?:)/g };

/**
 * @param {string} needle - normalized, non-empty term
 * @returns {RegExp}
 */
function getHighlightRegex(needle) {
    if (cachedPattern.term !== needle) {
        cachedPattern = { term: needle, regex: new RegExp(escapeRegExp(needle), "gi") };
    }
    return cachedPattern.regex;
}

/**
 * Every non-overlapping, case-insensitive occurrence of `term` in `text`.
 * Uses the same lower-casing as the filter, so a line that passed the filter always gets a highlight;
 * only when lower-casing changes the string length (a handful of Unicode letters) do offsets stop
 * mapping 1:1 and a case-insensitive RegExp on the original text is used instead.
 * @param {string} text
 * @param {string} term - raw or normalized term
 * @param {string} [lowerText] - `text.toLowerCase()` when already available
 * @returns {Array<[number, number]>} [start, end) offsets into `text`
 */
export function findMatchRanges(text, term, lowerText) {
    const needle = normalizeSearchTerm(term);
    if (!needle || !text) return [];
    const ranges = [];

    const lower = lowerText ?? text.toLowerCase();
    if (lower.length === text.length) {
        let from = 0;
        for (;;) {
            const start = lower.indexOf(needle, from);
            if (start === -1) break;
            const end = start + needle.length;
            ranges.push([start, end]);
            from = end;
        }
        return ranges;
    }

    const regex = getHighlightRegex(needle);
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
        if (match[0].length === 0) regex.lastIndex++;
    }
    return ranges;
}

/**
 * @typedef {{ text: string, hit: boolean }} TextPart
 */

/**
 * Split each segment of a line into plain / highlighted parts for `term`.
 * Matching runs on the joined line text (exactly what the filter searched), so a phrase that straddles
 * two segments is highlighted in both of them.
 * @param {Segment[] | undefined} segments
 * @param {string} term - raw or normalized term
 * @returns {Array<TextPart[] | null> | null} parts per segment (null for a segment without a hit), or
 *   null when nothing in the line matches
 */
export function splitSegmentsByTerm(segments, term) {
    if (!segments || segments.length === 0) return null;
    const text = joinSegments(segments);
    const ranges = findMatchRanges(text, term, getSegmentsSearchText(segments));
    if (ranges.length === 0) return null;

    const result = new Array(segments.length);
    let offset = 0;
    let r = 0;
    for (let i = 0; i < segments.length; i++) {
        const segText = segments[i]?.text ?? "";
        const segStart = offset;
        const segEnd = offset + segText.length;
        offset = segEnd + SEGMENT_SEPARATOR.length;

        // Ranges that ended before this segment can never hit it (or any later one).
        while (r < ranges.length && ranges[r][1] <= segStart) r++;

        let parts = null;
        let cursor = segStart;
        for (let j = r; j < ranges.length && ranges[j][0] < segEnd; j++) {
            const start = Math.max(ranges[j][0], segStart);
            const end = Math.min(ranges[j][1], segEnd);
            if (end <= start) continue;
            if (!parts) parts = [];
            if (start > cursor) parts.push({ text: text.slice(cursor, start), hit: false });
            parts.push({ text: text.slice(start, end), hit: true });
            cursor = end;
        }
        if (parts && cursor < segEnd) parts.push({ text: text.slice(cursor, segEnd), hit: false });
        result[i] = parts;
    }
    return result;
}
