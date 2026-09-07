import { test, expect } from "./custom-test";
import { takeScreenshots } from "./helper";

test.describe("homepage", () => {
    test("can load", async ({ page }, testInfo) => {
        await page.goto("");
        await expect(page.getByTestId("home-title")).toBeVisible();
        await takeScreenshots(page, testInfo, "home");
    });

    test("clicking on Doki goes to Transcript page", async ({ page, isMobile }) => {
        await page.goto("");

        const dokiBtn = page.getByTestId("key-icon-doki");
        await dokiBtn.click();
        await expect(page).toHaveURL(/live-transcript\/doki/);

        if (isMobile) {
            // Mobile doesn't have the sidebar
            return;
        }

        const viewBtn = page.getByTestId("page-button-view");
        await expect(viewBtn).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

        const graphBtn = page.getByTestId("page-button-graph");
        await expect(graphBtn).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

        const tagFixerBtn = page.getByTestId("page-button-tagFixer");
        await expect(tagFixerBtn).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    });

    test("redirects to Archive site", async ({ page }) => {
        await page.goto("");

        const dokiBtn = page.getByTestId("archive-btn");
        await dokiBtn.click();
        await expect(page).toHaveURL(/archived-transcript\//);
    });

    test("handle redirecting with wrong url", async ({ page }) => {
        await page.goto("wrongvalue/");

        const dokiBtn = page.getByTestId("key-icon-doki");
        await dokiBtn.click();
        await expect(page).toHaveURL(/live-transcript\/doki/);
    });

    test("streamer cards and sidebar entries are real links", async ({ page, isMobile }) => {
        await page.goto("");

        const dokiBtn = page.getByTestId("key-icon-doki");
        await expect(dokiBtn).toHaveAttribute("href", /\/live-transcript\/doki\/$/);
        await dokiBtn.click();
        await expect(page).toHaveURL(/live-transcript\/doki\//);

        if (isMobile) {
            // Mobile doesn't have the sidebar
            return;
        }

        await expect(page.getByTestId("page-button-home")).toHaveAttribute("href", /\/live-transcript\/$/);
        await expect(page.getByTestId("page-button-view")).toHaveAttribute("href", /\/live-transcript\/doki\/$/);
        await expect(page.getByTestId("page-button-graph")).toHaveAttribute(
            "href",
            /\/live-transcript\/doki\/graph\/$/,
        );
        await expect(page.getByTestId("page-button-tagFixer")).toHaveAttribute(
            "href",
            /\/live-transcript\/doki\/tagFixer\/$/,
        );
        await expect(page.getByTestId("page-button-github")).toHaveAttribute("target", "_blank");

        await page.getByTestId("page-button-graph").click();
        await expect(page).toHaveURL(/live-transcript\/doki\/graph\//);
        await expect(page.getByTestId("page-button-graph")).toHaveAttribute("aria-current", "page");
    });

    test("ctrl+click opens a streamer in a new tab", async ({ page, context, browserName, isMobile }) => {
        // Only desktop Chromium reliably opens a new tab on Ctrl/Cmd+click under automation.
        test.skip(browserName !== "chromium" || isMobile, "Needs desktop Chromium");
        await page.goto("");

        const dokiBtn = page.getByTestId("key-icon-doki");
        const [newPage] = await Promise.all([
            context.waitForEvent("page"),
            dokiBtn.click({ modifiers: ["ControlOrMeta"] }),
        ]);
        await expect(newPage).toHaveURL(/live-transcript\/doki\//);
        await expect(page).not.toHaveURL(/doki/);
    });
});
