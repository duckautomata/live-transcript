import { describe, expect, it } from "vitest";
import { basename } from "../config";
import { CURRENT_SITE_ID, hubUrl, sites } from "./sites";

describe("site switcher sites", () => {
    it("lists the transcript sites in a fixed order", () => {
        expect(sites.map((site) => site.title)).toEqual(["Live Transcript", "Archived Transcript"]);
    });

    it("links each site and its favicons by root-relative path", () => {
        expect(sites[1]).toEqual({
            id: "archived-transcript",
            title: "Archived Transcript",
            path: "/archived-transcript/",
            icon: "/archived-transcript/favicon-32x32.png",
            icon2x: "/archived-transcript/android-chrome-192x192.png",
        });
    });

    it("marks this site, served under the app's basename", () => {
        const current = sites.find((site) => site.id === CURRENT_SITE_ID);
        expect(current.path).toBe(basename);
    });
});

describe("hubUrl", () => {
    it("keeps the deployment's subdomain", () => {
        expect(hubUrl("www")).toBe("https://www.duck-automata.com/");
        expect(hubUrl("dev")).toBe("https://dev.duck-automata.com/");
    });

    it("falls back to www when no subdomain is configured", () => {
        expect(hubUrl("")).toBe("https://www.duck-automata.com/");
    });
});
