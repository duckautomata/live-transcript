/**
 * Dev-only schedule generator for the Stream Tracker page.
 *
 * Each scenario is rendered as real schedule CSV text, so a mocked run goes
 * through exactly the same parseCSV -> parsePTtoUTC -> matching pipeline as a
 * schedule fetched from the content server. Nothing here runs unless dev mode
 * is on and a scenario is selected.
 */

import { formatPTDateTime } from "./schedule";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const SCHEDULE_MOCK_OFF = "off";

/**
 * Selectable scenarios, one per state the tracker can display.
 * @type {{ value: string, label: string, needsActiveStream?: boolean }[]}
 */
export const SCHEDULE_MOCK_OPTIONS = [
    { value: SCHEDULE_MOCK_OFF, label: "Off — use the real schedule" },
    { value: "upcoming", label: "Countdown — next stream in 30 minutes" },
    { value: "imminent", label: "Countdown — next stream in 20 seconds" },
    { value: "overdue", label: "Countdown — stream overdue by 10 minutes" },
    { value: "late", label: "Lateness — current stream started 8m late", needsActiveStream: true },
    { value: "early", label: "Lateness — current stream started 4m early", needsActiveStream: true },
    { value: "onTime", label: "Lateness — current stream started on time", needsActiveStream: true },
    { value: "unlisted", label: "Fallback — stream is not in the schedule" },
];

/**
 * @param {string} scenario
 * @returns {boolean} True when the scenario needs an active stream start time.
 */
export function scenarioNeedsActiveStream(scenario) {
    return Boolean(SCHEDULE_MOCK_OPTIONS.find((option) => option.value === scenario)?.needsActiveStream);
}

/**
 * @param {{ id?: string, name: string, at: number }} spec
 * @returns {string} One CSV line.
 */
function toCsvLine({ id = "", name, at }) {
    const { date, time } = formatPTDateTime(new Date(at));
    // Titles are quoted because they may contain commas.
    return `${id},"${name}",YouTube,${date},${time}`;
}

/**
 * Build schedule CSV text for a scenario.
 *
 * Countdown scenarios are anchored to `now`, so the countdown ticks down from
 * whenever the scenario was selected. Lateness scenarios are anchored to the
 * active stream's real start time, so the delay shown is the one named in the
 * scenario regardless of when the stream actually started.
 *
 * @param {string} scenario - A value from {@link SCHEDULE_MOCK_OPTIONS}.
 * @param {object} context
 * @param {number} context.now - Current time, ms since epoch.
 * @param {string} [context.streamId] - Active stream id, if any.
 * @param {number} [context.startTime] - Active stream start, seconds since epoch.
 * @returns {string} CSV text, or "" when the scenario cannot be represented.
 */
export function buildMockScheduleCsv(scenario, { now, streamId = "", startTime = 0 }) {
    const actualMs = startTime > 0 ? startTime * 1000 : 0;
    /** @type {{ id?: string, name: string, at: number }[]} */
    let specs = [];

    switch (scenario) {
        case "upcoming":
            specs = [{ id: "mock-next", name: "[mock] Upcoming stream", at: now + 30 * MINUTE }];
            break;
        case "imminent":
            specs = [{ id: "mock-next", name: "[mock] Starting any moment", at: now + 20 * 1000 }];
            break;
        case "overdue":
            specs = [{ id: "mock-next", name: "[mock] Should have started already", at: now - 10 * MINUTE }];
            break;
        case "late":
            if (!actualMs) return "";
            specs = [{ id: streamId, name: "[mock] Current stream", at: actualMs - 8 * MINUTE }];
            break;
        case "early":
            if (!actualMs) return "";
            specs = [{ id: streamId, name: "[mock] Current stream", at: actualMs + 4 * MINUTE }];
            break;
        case "onTime":
            if (!actualMs) return "";
            specs = [{ id: streamId, name: "[mock] Current stream", at: actualMs - 20 * 1000 }];
            break;
        case "unlisted":
            // Far outside the 12h countdown window and matching nothing.
            specs = [
                { id: "mock-old", name: "[mock] Last week's stream", at: now - 3 * DAY },
                { id: "mock-future", name: "[mock] Next week's stream", at: now + 3 * DAY },
            ];
            break;
        default:
            return "";
    }

    const header = "stream_id,stream_name,platform,stream_date_pt,stream_time_pt";
    return [header, ...specs.map(toCsvLine)].join("\n");
}
