import { describe, expect, it } from "vitest";
import { currentPage, lineHash, pagePath, parseLineHash, streamUrl, streamerPath, toAbsoluteUrl } from "./links";

describe("paths", () => {
    it("builds streamer and page paths with trailing slashes", () => {
        expect(streamerPath("doki")).toBe("/doki/");
        expect(pagePath("doki")).toBe("/doki/");
        expect(pagePath("doki", "")).toBe("/doki/");
        expect(pagePath("doki", "graph")).toBe("/doki/graph/");
    });

    it("reads the page segment of a pathname", () => {
        expect(currentPage("/doki/")).toBe("");
        expect(currentPage("/doki")).toBe("");
        expect(currentPage("/doki/graph/")).toBe("graph");
        expect(currentPage("/doki/graph")).toBe("graph");
        expect(currentPage("/")).toBe("");
    });
});

describe("line hash", () => {
    it("round trips a line id", () => {
        expect(lineHash(12)).toBe("#L12");
        expect(parseLineHash("#L12")).toBe(12);
        expect(parseLineHash(lineHash(0))).toBe(0);
    });

    it("rejects anything else", () => {
        expect(parseLineHash("")).toBeNull();
        expect(parseLineHash(undefined)).toBeNull();
        expect(parseLineHash("#T00-01-02")).toBeNull();
        expect(parseLineHash("#L12abc")).toBeNull();
        expect(parseLineHash("#L-1")).toBeNull();
    });
});

describe("toAbsoluteUrl", () => {
    it("prefixes the basename and keeps search and hash", () => {
        expect(toAbsoluteUrl("/doki/?stream=abc#L12", "https://example.com")).toBe(
            "https://example.com/live-transcript/doki/?stream=abc#L12",
        );
        expect(toAbsoluteUrl("doki/", "https://example.com")).toBe("https://example.com/live-transcript/doki/");
    });
});

describe("streamUrl", () => {
    it("links Twitch VODs and YouTube live streams", () => {
        expect(streamUrl("123456")).toBe("https://www.twitch.tv/videos/123456");
        expect(streamUrl("123456", "01h02m03s")).toBe("https://www.twitch.tv/videos/123456?t=01h02m03s");
        expect(streamUrl("J2YmJL0PX5M")).toBe("https://www.youtube.com/live/J2YmJL0PX5M");
        expect(streamUrl("J2YmJL0PX5M", "05m10s")).toBe("https://www.youtube.com/live/J2YmJL0PX5M?t=05m10s");
    });
});
