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

export function parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines
        .slice(1)
        .map((line) => {
            const vals = line.split(",").map((v) => v.trim());
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
