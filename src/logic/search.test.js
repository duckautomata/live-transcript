import { describe, expect, it } from "vitest";
import {
    filterTranscript,
    findMatchRanges,
    getLineSearchText,
    joinSegments,
    normalizeSearchTerm,
    splitSegmentsByTerm,
} from "./search";

const line = (id, ...texts) => ({ id, timestamp: id, segments: texts.map((text, i) => ({ timestamp: id + i, text })) });

describe("joinSegments", () => {
    it("joins segment text with a single space", () => {
        expect(joinSegments([{ text: "hello" }, { text: "world" }])).toBe("hello world");
    });

    it("handles empty and missing input", () => {
        expect(joinSegments(undefined)).toBe("");
        expect(joinSegments([])).toBe("");
        expect(joinSegments([{ text: undefined }])).toBe("");
        expect(joinSegments([{ text: "a" }, {}, { text: "c" }])).toBe("a  c");
    });
});

describe("normalizeSearchTerm", () => {
    it("trims and lower-cases", () => {
        expect(normalizeSearchTerm("  Hello ")).toBe("hello");
        expect(normalizeSearchTerm("   ")).toBe("");
        expect(normalizeSearchTerm(undefined)).toBe("");
    });
});

describe("getLineSearchText", () => {
    it("returns lower-cased joined text and survives a line object being replaced", () => {
        const l = line(1, "Hello", "World");
        expect(getLineSearchText(l)).toBe("hello world");
        // A media update spreads the line into a new object but keeps the segments array.
        expect(getLineSearchText({ ...l, mediaAvailable: true })).toBe("hello world");
        expect(getLineSearchText({ id: 2, segments: undefined })).toBe("");
        expect(getLineSearchText(null)).toBe("");
        expect(getLineSearchText(undefined)).toBe("");
    });
});

describe("filterTranscript", () => {
    const lines = [line(0, "Good morning", "everyone"), line(1, "Yelling is fun"), line(2, "no yell here")];

    it("returns the same array for an empty or whitespace term", () => {
        expect(filterTranscript(lines, "")).toBe(lines);
        expect(filterTranscript(lines, "   ")).toBe(lines);
    });

    it("is case-insensitive and matches across the segment boundary", () => {
        expect(filterTranscript(lines, "YELL").map((l) => l.id)).toEqual([1, 2]);
        expect(filterTranscript(lines, "morning every").map((l) => l.id)).toEqual([0]);
        expect(filterTranscript(lines, " fun ").map((l) => l.id)).toEqual([1]);
    });
});

describe("findMatchRanges", () => {
    it("finds every case-insensitive occurrence", () => {
        expect(findMatchRanges("Yell, yell, YELL", "yell")).toEqual([
            [0, 4],
            [6, 10],
            [12, 16],
        ]);
    });

    it("treats the term literally, not as a regex", () => {
        expect(findMatchRanges("what? (yes) a.b", "?")).toEqual([[4, 5]]);
        expect(findMatchRanges("what? (yes) a.b", "(yes)")).toEqual([[6, 11]]);
        expect(findMatchRanges("axb a.b", "a.b")).toEqual([[4, 7]]);
    });

    it("returns nothing for empty input", () => {
        expect(findMatchRanges("", "a")).toEqual([]);
        expect(findMatchRanges("abc", "")).toEqual([]);
        expect(findMatchRanges("abc", "  ")).toEqual([]);
    });

    it("agrees with the filter on letters whose lower-case form changes length", () => {
        // "İ" lower-cases to two code units, so offsets no longer map 1:1 and the RegExp path is used.
        const text = "İstanbul is big";
        expect(findMatchRanges(text, "big")).toEqual([[12, 15]]);
        expect(findMatchRanges(text, "istanbul")).toEqual([]);
        // Plain text keeps using the lower-cased text, matching exactly what the filter matched.
        expect(findMatchRanges("Straße STRASSE", "straße")).toEqual([[0, 6]]);
    });
});

describe("splitSegmentsByTerm", () => {
    it("returns null when nothing matches or the term is empty", () => {
        expect(splitSegmentsByTerm([{ text: "hello" }], "xyz")).toBeNull();
        expect(splitSegmentsByTerm([{ text: "hello" }], "")).toBeNull();
        expect(splitSegmentsByTerm([], "hello")).toBeNull();
        expect(splitSegmentsByTerm(undefined, "hello")).toBeNull();
    });

    it("splits a single segment around every hit, keeping the original casing", () => {
        expect(splitSegmentsByTerm([{ text: "Yell and yell again" }], "yell")).toEqual([
            [
                { text: "Yell", hit: true },
                { text: " and ", hit: false },
                { text: "yell", hit: true },
                { text: " again", hit: false },
            ],
        ]);
    });

    it("leaves segments without a hit as null", () => {
        expect(splitSegmentsByTerm([{ text: "one" }, { text: "two" }, { text: "three" }], "two")).toEqual([
            null,
            [{ text: "two", hit: true }],
            null,
        ]);
    });

    it("highlights a phrase that straddles two segments", () => {
        expect(splitSegmentsByTerm([{ text: "say hello" }, { text: "world now" }], "hello world")).toEqual([
            [
                { text: "say ", hit: false },
                { text: "hello", hit: true },
            ],
            [
                { text: "world", hit: true },
                { text: " now", hit: false },
            ],
        ]);
    });

    it("handles a match that spans three segments and empty segments", () => {
        expect(splitSegmentsByTerm([{ text: "a" }, { text: "" }, { text: "b" }], "a  b")).toEqual([
            [{ text: "a", hit: true }],
            null,
            [{ text: "b", hit: true }],
        ]);
    });

    it("reproduces the original text when the parts are concatenated", () => {
        const segments = [{ text: "The quick brown" }, { text: "fox jumps over the" }, { text: "lazy dog" }];
        const parts = splitSegmentsByTerm(segments, "the");
        parts.forEach((segParts, i) => {
            if (segParts) {
                expect(segParts.map((p) => p.text).join("")).toBe(segments[i].text);
            }
        });
        expect(parts[0][0]).toEqual({ text: "The", hit: true });
        expect(parts[2]).toBeNull();
    });
});
