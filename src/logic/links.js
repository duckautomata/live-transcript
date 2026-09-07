import { basename } from "../config";

/** Search param that carries the past stream being viewed ("/doki/?stream=<id>"). */
export const STREAM_PARAM = "stream";

/**
 * In-app path (without the basename) of a streamer's transcript view.
 * @param {string} wsKey
 * @returns {string}
 */
export const streamerPath = (wsKey) => `/${wsKey}/`;

/**
 * In-app path of one of a streamer's pages. An empty page is the transcript view.
 * Always ends with a slash so the sidebar can tell "/doki/" (view selected) apart from "/doki".
 * @param {string} wsKey
 * @param {string} [page] - "", "graph", "track", "tagFixer"
 * @returns {string}
 */
export const pagePath = (wsKey, page = "") => (page ? `/${wsKey}/${page}/` : `/${wsKey}/`);

/**
 * The page segment of an in-app pathname: "/doki/graph/" -> "graph", "/doki/" and "/doki" -> "".
 * @param {string} pathname - router pathname (without the basename)
 * @returns {string}
 */
export const currentPage = (pathname) => pathname.split("/")[2] ?? "";

/**
 * Hash that deep links to a transcript line ("#L1234").
 * @param {number} id
 * @returns {string}
 */
export const lineHash = (id) => `#L${id}`;

/**
 * Decode a line hash back into the line id. Returns null for any other hash.
 * @param {string} hash - location.hash, including the leading "#"
 * @returns {number | null}
 */
export function parseLineHash(hash) {
    const match = /^#L(\d+)$/.exec(hash || "");
    return match ? Number(match[1]) : null;
}

/**
 * Turn an in-app path ("/doki/?stream=abc#L12") into a full, shareable URL.
 * @param {string} path
 * @param {string} [origin] - defaults to the current origin
 * @returns {string}
 */
export function toAbsoluteUrl(path, origin = window.location.origin) {
    const relative = path.startsWith("/") ? path.substring(1) : path;
    return new URL(`${basename}${relative}`, origin).toString();
}

/**
 * URL of the original stream, optionally at a relative time ("01h02m03s").
 * Numeric ids are Twitch VODs, everything else is a YouTube live stream.
 * @param {string} streamId
 * @param {string} [relativeTime]
 * @returns {string}
 */
export function streamUrl(streamId, relativeTime) {
    const time = relativeTime ? `?t=${relativeTime}` : "";
    if (/^\d+$/.test(streamId)) {
        return `https://www.twitch.tv/videos/${streamId}${time}`;
    }
    return `https://www.youtube.com/live/${streamId}${time}`;
}
