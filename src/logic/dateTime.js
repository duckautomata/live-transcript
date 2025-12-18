/**
 * Converts a Unix timestamp (seconds) to a local time string.
 * @param {number} unix - Unix timestamp in seconds.
 * @returns {string} Local time string.
 */
export const unixToLocal = (unix) => {
    // Convert to milliseconds
    const date = new Date(unix * 1000);

    // Convert to local time string
    const localTime = date.toLocaleTimeString();

    return localTime;
};

/**
 * Converts a Unix timestamp (seconds) to a relative time string format (e.g., "01h02m03s").
 * @param {number} unix - The current Unix timestamp in seconds.
 * @param {number} startTime - The start Unix timestamp in seconds.
 * @returns {string} Formatted relative time string.
 */
export const unixToRelative = (unix, startTime) => {
    if (!startTime || !unix || startTime <= 0 || unix <= 0) {
        return "00:00:00";
    }

    let offset = unix - startTime;
    const isNegative = offset < 0;
    offset = Math.abs(offset);

    const hours = Math.floor(offset / 3600);
    const minutes = Math.floor((offset % 3600) / 60);
    const remainingSeconds = offset % 60;

    let timeString = "";

    if (hours === 0) {
        timeString = `${String(minutes).padStart(2, "0")}m${String(remainingSeconds).padStart(2, "0")}s`;
    } else {
        timeString = `${String(hours).padStart(2, "0")}h${String(minutes).padStart(2, "0")}m${String(remainingSeconds).padStart(2, "0")}s`;
    }

    return isNegative ? "-" + timeString : timeString;
};

/**
 * Converts a Unix timestamp (seconds) to a UTC time string.
 * @param {number} unix - Unix timestamp in seconds.
 * @returns {string} UTC time string in HH:MM:SS format.
 */
export const unixToUTC = (unix) => {
    // Convert to milliseconds
    const date = new Date(unix * 1000);

    // Convert to local time string
    const utcHours = date.getUTCHours().toString().padStart(2, "0");
    const utcMinutes = date.getUTCMinutes().toString().padStart(2, "0");
    const utcSeconds = date.getUTCSeconds().toString().padStart(2, "0");

    return `${utcHours}:${utcMinutes}:${utcSeconds}`;
};
