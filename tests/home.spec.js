import { test, expect } from "@playwright/test";
import { takeScreenshots } from "./helper";

test.describe("homepage", () => {
    test("can load", async ({ page }, testInfo) => {
        await page.goto("");
        await expect(page.getByText("Live Transcripts")).toBeVisible();
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
        await expect(page).toHaveURL(/archived-transcript/);
    });

    test("handle redirecting with wrong url", async ({ page }) => {
        await page.goto("wrongvalue/");

        const dokiBtn = page.getByTestId("key-icon-doki");
        await dokiBtn.click();
        await expect(page).toHaveURL(/live-transcript\/doki/);
    });
});
