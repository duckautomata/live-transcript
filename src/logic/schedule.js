/**
 * Helpers for the Stream Tracker page.
 *
 * The schedule comes from a per-streamer CSV (scheduled start times in Pacific
 * Time). The actual start times come from the server (the current stream and
 * the cached past streams). Matching the two by stream id gives us how late or
 * early each stream started.
 */

/** A stream is considered "on time" when it starts within this window. */
export const ON_TIME_THRESHOLD_MS = 60 * 1000;

/**
 * Deltas larger than this are treated as bad data (usually a stream id that was
 * pasted onto the wrong schedule row) rather than a genuinely late stream.
 */
export const MAX_PLAUSIBLE_DELTA_MS = 12 * 60 * 60 * 1000;

/**
 * @typedef {object} CsvRow
 * @property {string} stream_id
 * @property {string} stream_name
 * @property {string} platform
 * @property {string} stream_date_pt
 * @property {string} stream_time_pt
 */

/**
 * @typedef {CsvRow & { startUTC: Date | null }} ScheduledStream
 */

/**
 * @typedef {object} LatenessRecord
 * @property {string} streamId
 * @property {string} streamName
 * @property {string} platform
 * @property {number} scheduledMs - Scheduled start, ms since epoch.
 * @property {number} actualMs - Actual start, ms since epoch.
 */

/**
 * Parse a Pacific Time date+time string into a UTC Date object.
 * Handles PST (UTC-8) and PDT (UTC-7) automatically via Intl.
 * @param {string} dateStr - The date string (e.g., "M/D/YYYY" or "YYYY-MM-DD").
 * @param {string} timeStr - The time string (e.g., "HH:mm:ss" or "hh:mm:ss AM/PM").
 * @returns {Date | null} The UTC Date object, or null if parsing fails.
 */
export function parsePTtoUTC(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    // Normalize date (M/D/YYYY -> YYYY-MM-DD or keep YYYY-MM-DD)
    let normalizedDate = dateStr.trim();
    if (normalizedDate.includes("/")) {
        const [m, d, y] = normalizedDate.split("/");
        normalizedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // Normalize time (12h format PM/AM -> 24h format HH:mm:ss)
    let normalizedTime = timeStr.trim();
    const ampmMatch = normalizedTime.match(/(am|pm)/i);
    if (ampmMatch) {
        const ampm = ampmMatch[0].toLowerCase();
        const timeOnly = normalizedTime.replace(/(am|pm)/i, "").trim();
        const parts = timeOnly.split(":");
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1] || "00";
        const seconds = parts[2] || "00";

        if (ampm === "pm" && hours < 12) hours += 12;
        if (ampm === "am" && hours === 12) hours = 0;
        normalizedTime = `${String(hours).padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
    } else {
        // Ensure HH:mm:ss
        const parts = normalizedTime.split(":");
        if (parts.length === 2) normalizedTime += ":00";
    }

    try {
        // Use a fixed guess in PT to determine if we are in DST
        const guess = new Date(`${normalizedDate}T${normalizedTime}-08:00`);
        if (isNaN(guess.getTime())) return null;

        const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Los_Angeles",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

        const p = {};
        fmt.formatToParts(guess).forEach(({ type, value }) => {
            p[type] = value;
        });
        const guessAsLocal = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`);
        const targetLocal = new Date(`${normalizedDate}T${normalizedTime}`);

        const result = new Date(guess.getTime() + (targetLocal - guessAsLocal));
        return isNaN(result.getTime()) ? null : result;
    } catch {
        return null;
    }
}

/**
 * Inverse of {@link parsePTtoUTC}: render an instant as the Pacific Time date and
 * time strings a schedule CSV uses.
 * @param {Date} date
 * @returns {{ date: string, time: string }} e.g. { date: "2026-04-01", time: "17:00:00" }
 */
export function formatPTDateTime(date) {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const p = {};
    fmt.formatToParts(date).forEach(({ type, value }) => {
        p[type] = value;
    });

    // hour12:false reports midnight as "24" in V8, which parses back a day late.
    const hour = p.hour === "24" ? "00" : p.hour;
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}:${p.second}` };
}

/**
 * Split a single CSV line into fields, honoring double-quoted values so that a
 * comma inside a stream title does not shift every column after it.
 * @param {string} line
 * @returns {string[]}
 */
function splitCsvLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    // Escaped quote ("") inside a quoted field.
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            fields.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * @param {string} text - Raw CSV text.
 * @returns {CsvRow[]} Rows that have both a scheduled date and time.
 */
export function parseCSV(text) {
    if (!text) return [];
    const lines = text
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");
    if (lines.length < 2) return [];

    const headers = splitCsvLine(lines[0]);
    return lines
        .slice(1)
        .map((line) => {
            const vals = splitCsvLine(line);
            const row = {};
            headers.forEach((h, i) => {
                row[h] = vals[i] ?? "";
            });
            return row;
        })
        .filter((row) => row.stream_date_pt && row.stream_time_pt);
}

function pad(n) {
    return String(Math.floor(n)).padStart(2, "0");
}

export function formatDuration(absMs) {
    const totalSec = Math.round(absMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
    if (m > 0) return `${m}m ${pad(s)}s`;
    return `${s}s`;
}

/**
 * Format a lateness delta with an explicit sign. Positive is late, negative is early.
 * @param {number} ms
 * @returns {string}
 */
export function formatSignedDuration(ms) {
    const rounded = Math.round(ms / 1000) * 1000;
    if (rounded === 0) return "0s";
    return `${rounded > 0 ? "+" : "-"}${formatDuration(Math.abs(rounded))}`;
}

/**
 * @param {Date | null} date - The Date object to format.
 */
export function formatLocalTime(date) {
    if (!date) return "Unknown Time";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * @param {Date | null} date - The Date object to format.
 */
export function formatPTTime(date) {
    if (!date) return "Unknown Time";
    return date.toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Short calendar date used for chart labels and the history table.
 * @param {number} ms - Milliseconds since epoch.
 */
export function formatShortDate(ms) {
    if (!ms) return "⊗︎";
    return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * @param {number} latenessMs
 * @returns {"early" | "onTime" | "late"}
 */
export function latenessCategory(latenessMs) {
    if (Math.abs(latenessMs) < ON_TIME_THRESHOLD_MS) return "onTime";
    return latenessMs > 0 ? "late" : "early";
}

/**
 * Match scheduled streams against known actual start times.
 * Only rows carrying a stream id can be matched, and implausible deltas are
 * dropped so a mistyped schedule row cannot skew the metrics.
 * @param {ScheduledStream[]} scheduledStreams
 * @param {Map<string, number>} actualStartsMs - stream id -> actual start (ms since epoch).
 * @returns {LatenessRecord[]} Oldest scheduled start first.
 */
export function buildLatenessRecords(scheduledStreams, actualStartsMs) {
    if (!scheduledStreams?.length || !actualStartsMs?.size) return [];

    const records = [];
    scheduledStreams.forEach((row) => {
        const streamId = row?.stream_id ? String(row.stream_id) : "";
        if (!streamId || !row.startUTC) return;

        const actualMs = actualStartsMs.get(streamId);
        if (!actualMs) return;

        const scheduledMs = row.startUTC.getTime();
        if (Math.abs(actualMs - scheduledMs) > MAX_PLAUSIBLE_DELTA_MS) return;

        records.push({
            streamId,
            streamName: row.stream_name ?? "",
            platform: row.platform ?? "",
            scheduledMs,
            actualMs,
        });
    });

    return records.sort((a, b) => a.scheduledMs - b.scheduledMs);
}

/**
 * Combine two record sets, keeping one entry per stream id. Records from
 * `incoming` win, since they were just derived from live server data.
 * @param {LatenessRecord[]} existing
 * @param {LatenessRecord[]} incoming
 * @returns {LatenessRecord[]} Oldest scheduled start first.
 */
export function mergeLatenessRecords(existing, incoming) {
    const byId = new Map();
    (existing ?? []).forEach((record) => {
        if (record?.streamId) byId.set(record.streamId, record);
    });
    (incoming ?? []).forEach((record) => {
        if (record?.streamId) byId.set(record.streamId, record);
    });

    return [...byId.values()].sort((a, b) => a.scheduledMs - b.scheduledMs);
}

/**
 * @typedef {object} LatenessSummary
 * @property {number} count
 * @property {number} meanMs
 * @property {number} medianMs
 * @property {number} bestMs - Delta closest to the scheduled time, signed.
 * @property {number} worstMs - Delta furthest from the scheduled time, signed.
 *   Starting early counts against a stream exactly as much as starting late,
 *   so both of these are picked by absolute distance from schedule.
 * @property {number} earlyCount
 * @property {number} onTimeCount
 * @property {number} lateCount
 * @property {number} onTimeRate - 0-1.
 */

/**
 * @param {LatenessRecord[]} records
 * @returns {LatenessSummary}
 */
export function summarizeLateness(records) {
    const empty = {
        count: 0,
        meanMs: 0,
        medianMs: 0,
        bestMs: 0,
        worstMs: 0,
        earlyCount: 0,
        onTimeCount: 0,
        lateCount: 0,
        onTimeRate: 0,
    };
    if (!records?.length) return empty;

    const deltas = records.map((r) => r.actualMs - r.scheduledMs).sort((a, b) => a - b);
    const count = deltas.length;
    const mid = Math.floor(count / 2);

    const buckets = { early: 0, onTime: 0, late: 0 };
    deltas.forEach((delta) => {
        buckets[latenessCategory(delta)] += 1;
    });

    return {
        count,
        meanMs: deltas.reduce((sum, d) => sum + d, 0) / count,
        medianMs: count % 2 === 0 ? (deltas[mid - 1] + deltas[mid]) / 2 : deltas[mid],
        bestMs: deltas.reduce((best, d) => (Math.abs(d) < Math.abs(best) ? d : best), deltas[0]),
        worstMs: deltas.reduce((worst, d) => (Math.abs(d) > Math.abs(worst) ? d : worst), deltas[0]),
        earlyCount: buckets.early,
        onTimeCount: buckets.onTime,
        lateCount: buckets.late,
        onTimeRate: buckets.onTime / count,
    };
}
