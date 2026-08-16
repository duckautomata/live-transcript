import { describe, expect, it } from "vitest";
import { SCHEDULE_MOCK_OPTIONS, buildMockScheduleCsv, scenarioNeedsActiveStream } from "./scheduleMock";
import { parseCSV, parsePTtoUTC } from "./schedule";

const NOW = Date.UTC(2026, 3, 2, 19, 30, 0); // 2026-04-02 12:30 PDT
const START_TIME = Math.floor(NOW / 1000); // active stream started "now"

/**
 * Round-trip a generated scenario back into scheduled instants.
 * @param {string} scenario
 * @param {object} [context]
 * @returns {{ id: string, name: string, scheduledMs: number }[]}
 */
function scheduledRows(scenario, context = {}) {
    const csv = buildMockScheduleCsv(scenario, { now: NOW, streamId: "abc123", startTime: START_TIME, ...context });
    return parseCSV(csv).map((row) => ({
        id: row.stream_id,
        name: row.stream_name,
        scheduledMs: parsePTtoUTC(row.stream_date_pt, row.stream_time_pt).getTime(),
    }));
}

describe("schedule mock", () => {
    it("should generate CSV that survives the real parse pipeline", () => {
        const rows = scheduledRows("upcoming");
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("mock-next");
        // Titles contain no commas here, but they are quoted regardless.
        expect(rows[0].name).toBe("[mock] Upcoming stream");
    });

    it("should anchor countdown scenarios to now", () => {
        expect(scheduledRows("upcoming")[0].scheduledMs).toBe(NOW + 30 * 60000);
        expect(scheduledRows("imminent")[0].scheduledMs).toBe(NOW + 20000);
        expect(scheduledRows("overdue")[0].scheduledMs).toBe(NOW - 10 * 60000);
    });

    it("should anchor lateness scenarios to the actual start time", () => {
        // Scheduled 8 minutes before the stream actually started => started 8m late.
        expect(START_TIME * 1000 - scheduledRows("late")[0].scheduledMs).toBe(8 * 60000);
        // Scheduled 4 minutes after it started => started 4m early.
        expect(START_TIME * 1000 - scheduledRows("early")[0].scheduledMs).toBe(-4 * 60000);
        expect(START_TIME * 1000 - scheduledRows("onTime")[0].scheduledMs).toBe(20000);
    });

    it("should tag lateness rows with the active stream id so they match", () => {
        expect(scheduledRows("late")[0].id).toBe("abc123");
    });

    it("should put the unlisted scenario outside the countdown window", () => {
        const rows = scheduledRows("unlisted");
        expect(rows).toHaveLength(2);
        rows.forEach((row) => {
            expect(Math.abs(row.scheduledMs - NOW)).toBeGreaterThan(12 * 3600 * 1000);
        });
    });

    it("should return empty text when a lateness scenario has no active stream", () => {
        expect(buildMockScheduleCsv("late", { now: NOW, streamId: "", startTime: 0 })).toBe("");
        expect(buildMockScheduleCsv("early", { now: NOW, streamId: "", startTime: 0 })).toBe("");
        expect(buildMockScheduleCsv("onTime", { now: NOW, streamId: "", startTime: 0 })).toBe("");
    });

    it("should return empty text for 'off' and unknown scenarios", () => {
        expect(buildMockScheduleCsv("off", { now: NOW })).toBe("");
        expect(buildMockScheduleCsv("nonsense", { now: NOW })).toBe("");
    });

    it("should round-trip correctly across a DST boundary", () => {
        // 2026-01-15 is PST (-8); the generator and parser must agree.
        const winter = Date.UTC(2026, 0, 15, 20, 0, 0);
        const [row] = parseCSV(buildMockScheduleCsv("upcoming", { now: winter }));
        expect(parsePTtoUTC(row.stream_date_pt, row.stream_time_pt).getTime()).toBe(winter + 30 * 60000);
    });

    it("should round-trip an instant that is midnight Pacific Time", () => {
        // V8 renders midnight as hour "24" with hour12:false, which would land a day late.
        const midnightPT = Date.UTC(2026, 3, 3, 7, 0, 0); // 2026-04-03 00:00 PDT
        const [row] = parseCSV(buildMockScheduleCsv("upcoming", { now: midnightPT - 30 * 60000 }));
        expect(parsePTtoUTC(row.stream_date_pt, row.stream_time_pt).getTime()).toBe(midnightPT);
    });

    describe("scenarioNeedsActiveStream", () => {
        it("should flag only the lateness scenarios", () => {
            expect(scenarioNeedsActiveStream("late")).toBe(true);
            expect(scenarioNeedsActiveStream("early")).toBe(true);
            expect(scenarioNeedsActiveStream("onTime")).toBe(true);
            expect(scenarioNeedsActiveStream("upcoming")).toBe(false);
            expect(scenarioNeedsActiveStream("off")).toBe(false);
            expect(scenarioNeedsActiveStream("nonsense")).toBe(false);
        });
    });

    it("should expose an off option first", () => {
        expect(SCHEDULE_MOCK_OPTIONS[0].value).toBe("off");
    });
});
