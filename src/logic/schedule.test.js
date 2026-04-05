import { describe, expect, it } from "vitest";
import { parsePTtoUTC, parseCSV, formatDuration, formatPTTime } from "./schedule";

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
