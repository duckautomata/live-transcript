import { describe, expect, it } from "vitest";
import {
    ON_TIME_THRESHOLD_MS,
    buildLatenessRecords,
    formatDuration,
    formatPTTime,
    formatSignedDuration,
    latenessCategory,
    mergeLatenessRecords,
    parseCSV,
    parsePTtoUTC,
    summarizeLateness,
} from "./schedule";

/**
 * @param {string} streamId
 * @param {string} dateStr
 * @param {string} timeStr
 * @param {string} name
 */
function scheduled(streamId, dateStr, timeStr, name = "Stream") {
    return {
        stream_id: streamId,
        stream_name: name,
        platform: "YouTube",
        stream_date_pt: dateStr,
        stream_time_pt: timeStr,
        startUTC: parsePTtoUTC(dateStr, timeStr),
    };
}

describe("schedule logic", () => {
    describe("parsePTtoUTC", () => {
        it("should parse M/D/YYYY and 12h time (PDT)", () => {
            // March 31, 2026, 5:00 PM PT -> April 1, 2026, 00:00:00 UTC (PDT is -7)
            const date = parsePTtoUTC("3/31/2026", "5:00:00 PM");
            expect(date?.toISOString()).toBe("2026-04-01T00:00:00.000Z");
        });

        it("should parse YYYY-MM-DD and 24h time", () => {
            const date = parsePTtoUTC("2026-04-01", "10:00:00");
            // 10:00 AM PDT is 17:00 UTC
            expect(date?.getUTCHours()).toBe(17);
        });

        it("should handle AM correctly", () => {
            const date = parsePTtoUTC("4/5/2026", "5:00:00 AM");
            // 5:00 AM PDT is 12:00 UTC
            expect(date?.toISOString()).toBe("2026-04-05T12:00:00.000Z");
        });

        it("should handle PST (standard time) offsets", () => {
            // January 15, 2026, 5:00 PM PST (-8) -> January 16, 2026, 01:00 UTC
            const date = parsePTtoUTC("1/15/2026", "5:00:00 PM");
            expect(date?.toISOString()).toBe("2026-01-16T01:00:00.000Z");
        });

        it("should return null for invalid inputs", () => {
            expect(parsePTtoUTC("", "")).toBeNull();
            expect(parsePTtoUTC("invalid", "invalid")).toBeNull();
        });
    });

    describe("parseCSV", () => {
        it("should parse valid CSV text", () => {
            const csv =
                "stream_id,stream_name,platform,stream_date_pt,stream_time_pt\n1,Test,YouTube,4/1/2026,10:00 AM";
            const result = parseCSV(csv);
            expect(result).toHaveLength(1);
            expect(result[0].stream_name).toBe("Test");
        });

        it("should keep columns aligned when a quoted field contains a comma", () => {
            const csv =
                'stream_id,stream_name,platform,stream_date_pt,stream_time_pt\n1,"Hello, world",YouTube,4/1/2026,10:00 AM';
            const result = parseCSV(csv);
            expect(result[0].stream_name).toBe("Hello, world");
            expect(result[0].platform).toBe("YouTube");
            expect(result[0].stream_time_pt).toBe("10:00 AM");
        });

        it("should unescape doubled quotes inside a quoted field", () => {
            const csv =
                'stream_id,stream_name,platform,stream_date_pt,stream_time_pt\n1,"He said ""hi""",YouTube,4/1/2026,10:00 AM';
            expect(parseCSV(csv)[0].stream_name).toBe('He said "hi"');
        });

        it("should handle CRLF line endings", () => {
            const csv =
                "stream_id,stream_name,platform,stream_date_pt,stream_time_pt\r\n1,Test,YouTube,4/1/2026,10:00 AM\r\n";
            expect(parseCSV(csv)).toHaveLength(1);
        });

        it("should filter out rows with missing date/time", () => {
            const csv = "stream_id,stream_name,platform,stream_date_pt,stream_time_pt\n1,Test,YouTube,,";
            const result = parseCSV(csv);
            expect(result).toHaveLength(0);
        });

        it("should return empty array for empty CSV or headers only", () => {
            expect(parseCSV("")).toEqual([]);
            expect(parseCSV("stream_id,stream_name")).toEqual([]);
        });
    });

    describe("formatDuration", () => {
        it("should format milliseconds into readable duration string", () => {
            expect(formatDuration(0)).toBe("0s");
            expect(formatDuration(1000)).toBe("1s");
            expect(formatDuration(61000)).toBe("1m 01s");
            expect(formatDuration(3661000)).toBe("1h 01m 01s");
            expect(formatDuration(3600000 * 2 + 60000 * 5 + 1000)).toBe("2h 05m 01s");
        });
    });

    describe("formatSignedDuration", () => {
        it("should prefix late values with + and early values with -", () => {
            expect(formatSignedDuration(0)).toBe("0s");
            expect(formatSignedDuration(90000)).toBe("+1m 30s");
            expect(formatSignedDuration(-90000)).toBe("-1m 30s");
        });

        it("should round sub-second values to zero", () => {
            expect(formatSignedDuration(400)).toBe("0s");
        });
    });

    describe("latenessCategory", () => {
        it("should categorize against the on-time window", () => {
            expect(latenessCategory(0)).toBe("onTime");
            expect(latenessCategory(ON_TIME_THRESHOLD_MS - 1)).toBe("onTime");
            expect(latenessCategory(-(ON_TIME_THRESHOLD_MS - 1))).toBe("onTime");
            expect(latenessCategory(ON_TIME_THRESHOLD_MS)).toBe("late");
            expect(latenessCategory(-ON_TIME_THRESHOLD_MS)).toBe("early");
        });
    });

    describe("buildLatenessRecords", () => {
        it("should match scheduled streams to actual start times by stream id", () => {
            const streams = [scheduled("a", "4/1/2026", "5:00:00 PM"), scheduled("b", "4/2/2026", "5:00:00 PM")];
            const actual = new Map([
                ["a", streams[0].startUTC.getTime() + 300000], // 5 minutes late
                ["b", streams[1].startUTC.getTime() - 60000], // 1 minute early
            ]);

            const records = buildLatenessRecords(streams, actual);
            expect(records).toHaveLength(2);
            expect(records[0].actualMs - records[0].scheduledMs).toBe(300000);
            expect(records[1].actualMs - records[1].scheduledMs).toBe(-60000);
        });

        it("should skip rows without a stream id or without an actual start", () => {
            const streams = [scheduled("", "4/1/2026", "5:00:00 PM"), scheduled("b", "4/2/2026", "5:00:00 PM")];
            expect(buildLatenessRecords(streams, new Map())).toEqual([]);
            expect(buildLatenessRecords(streams, new Map([["b", 1]]))).toHaveLength(0);
        });

        it("should drop implausible deltas caused by bad schedule data", () => {
            const streams = [scheduled("a", "4/1/2026", "5:00:00 PM")];
            const actual = new Map([["a", streams[0].startUTC.getTime() + 13 * 3600 * 1000]]);
            expect(buildLatenessRecords(streams, actual)).toEqual([]);
        });

        it("should sort oldest scheduled start first", () => {
            const streams = [scheduled("b", "4/2/2026", "5:00:00 PM"), scheduled("a", "4/1/2026", "5:00:00 PM")];
            const actual = new Map([
                ["a", streams[1].startUTC.getTime()],
                ["b", streams[0].startUTC.getTime()],
            ]);
            expect(buildLatenessRecords(streams, actual).map((r) => r.streamId)).toEqual(["a", "b"]);
        });

        it("should return empty for missing inputs", () => {
            expect(buildLatenessRecords([], new Map())).toEqual([]);
            expect(buildLatenessRecords(null, null)).toEqual([]);
        });
    });

    describe("mergeLatenessRecords", () => {
        const record = (streamId, scheduledMs, actualMs) => ({
            streamId,
            streamName: streamId,
            platform: "YouTube",
            scheduledMs,
            actualMs,
        });

        it("should dedupe by stream id, preferring the incoming record", () => {
            const merged = mergeLatenessRecords([record("a", 100, 200)], [record("a", 100, 300)]);
            expect(merged).toHaveLength(1);
            expect(merged[0].actualMs).toBe(300);
        });

        it("should keep the union sorted by scheduled time", () => {
            const merged = mergeLatenessRecords([record("b", 200, 200)], [record("a", 100, 100)]);
            expect(merged.map((r) => r.streamId)).toEqual(["a", "b"]);
        });

        it("should tolerate missing inputs", () => {
            expect(mergeLatenessRecords(null, null)).toEqual([]);
            expect(mergeLatenessRecords(undefined, [record("a", 1, 1)])).toHaveLength(1);
        });
    });

    describe("summarizeLateness", () => {
        const record = (delta) => ({
            streamId: `s${delta}`,
            streamName: "s",
            platform: "YouTube",
            scheduledMs: 1000000,
            actualMs: 1000000 + delta,
        });

        it("should return zeroed stats when there are no records", () => {
            const summary = summarizeLateness([]);
            expect(summary.count).toBe(0);
            expect(summary.onTimeRate).toBe(0);
        });

        it("should compute mean, median and extremes", () => {
            // -120s, 0s, +60s, +300s
            const summary = summarizeLateness([record(-120000), record(0), record(60000), record(300000)]);
            expect(summary.count).toBe(4);
            expect(summary.meanMs).toBe((-120000 + 0 + 60000 + 300000) / 4);
            expect(summary.medianMs).toBe((0 + 60000) / 2);
            expect(summary.bestMs).toBe(0);
            expect(summary.worstMs).toBe(300000);
        });

        it("should rank best and worst by distance from schedule, not by sign", () => {
            // An hour early is exactly as bad as an hour late, so the early
            // outlier is the worst start and the modest delay is the best.
            const summary = summarizeLateness([record(-3600000), record(300000)]);
            expect(summary.worstMs).toBe(-3600000);
            expect(summary.bestMs).toBe(300000);
        });

        it("should treat equal distances early and late as equally good", () => {
            const early = summarizeLateness([record(-300000), record(900000)]);
            const late = summarizeLateness([record(300000), record(900000)]);
            expect(Math.abs(early.bestMs)).toBe(Math.abs(late.bestMs));
            expect(early.worstMs).toBe(900000);
            expect(late.worstMs).toBe(900000);
        });

        it("should report a single record as both best and worst", () => {
            const summary = summarizeLateness([record(-450000)]);
            expect(summary.bestMs).toBe(-450000);
            expect(summary.worstMs).toBe(-450000);
        });

        it("should use the middle value as the median for odd counts", () => {
            const summary = summarizeLateness([record(-120000), record(0), record(300000)]);
            expect(summary.medianMs).toBe(0);
        });

        it("should bucket records into early / on time / late", () => {
            const summary = summarizeLateness([record(-120000), record(0), record(30000), record(300000)]);
            expect(summary.earlyCount).toBe(1);
            expect(summary.onTimeCount).toBe(2);
            expect(summary.lateCount).toBe(1);
            expect(summary.onTimeRate).toBe(0.5);
        });
    });

    describe("formatPTTime", () => {
        it("should format a date into Pacific Time string (AM/PM)", () => {
            const date = new Date("2026-04-01T00:00:00Z");
            const ptStr = formatPTTime(date);
            // 00:00 UTC is (usually) 5:00 PM the previous day or same day PT depending on DST
            // April 1, 2026 00:00 UTC -> March 31, 2026 5:00 PM PDT (-7)
            expect(ptStr).toMatch(/05:00 PM/i);
        });
    });
});
