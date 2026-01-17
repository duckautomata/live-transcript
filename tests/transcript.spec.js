import { test, expect } from "@playwright/test";
import {
    loadInDevmode,
    setMediaAvailability,
    setMediaType,
    setStreamLive,
    simulateLive,
    takeScreenshots,
} from "./helper";
import * as mockconst from "./mockconst";

test("Transcript page loads", async ({ page }, testInfo) => {
    await loadInDevmode(page, "mock");
    await expect(page).toHaveURL(/mock/);
    await expect(page.getByText(mockconst.title)).toBeVisible();

    const paginationTab = page.getByTestId("transcript-tab-pagination");
    const virtualTab = page.getByTestId("transcript-tab-virtual");
    const visualTab = page.getByTestId("transcript-tab-visual");

    await paginationTab.click();
    await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
    await takeScreenshots(page, testInfo, "transcript-pagination");

    await virtualTab.click();
    await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
    await takeScreenshots(page, testInfo, "transcript-virtual");

    await visualTab.click();
    await expect(page.getByTestId(`transcript-frame-${mockconst.emptyLineId}`)).toBeVisible();
    await takeScreenshots(page, testInfo, "transcript-visual");
});

test.describe("Transcript search", () => {
    test("filters transcript in all views", async ({ page }, testInfo) => {
        await loadInDevmode(page, "mock");

        const searchInput = page.locator("#search-transcript");
        await expect(searchInput).toBeVisible();

        const paginationTab = page.getByTestId("transcript-tab-pagination");
        const virtualTab = page.getByTestId("transcript-tab-virtual");
        const visualTab = page.getByTestId("transcript-tab-visual");

        // Pagination
        await paginationTab.click();
        await searchInput.fill(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();
        let numOfLines = await page.locator('[data-testid^="transcript-line-"]').count();
        expect(numOfLines).toBe(mockconst.searchTermSize);
        await takeScreenshots(page, testInfo, "search-pagination");
        await page.getByTestId("clear-search").click();
        numOfLines = await page.locator('[data-testid^="transcript-line-"]').count();
        expect(numOfLines).toBeGreaterThan(mockconst.searchTermSize);

        // Virtual
        await virtualTab.click();
        await searchInput.fill(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();
        numOfLines = await page.locator('[data-testid^="transcript-line-"]').count();
        expect(numOfLines).toBe(mockconst.searchTermSize);
        await takeScreenshots(page, testInfo, "search-virtual");
        await page.getByTestId("clear-search").click();
        numOfLines = await page.locator('[data-testid^="transcript-line-"]').count();
        expect(numOfLines).toBeGreaterThan(mockconst.searchTermSize);

        // Visual
        await visualTab.click();
        await searchInput.fill(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-frame-${mockconst.searchLineId}`)).toBeVisible();
        numOfLines = await page.locator('[data-testid^="transcript-frame-"]').count();
        expect(numOfLines).toBe(mockconst.searchTermSize);
        await takeScreenshots(page, testInfo, "search-visual");
        await page.getByTestId("clear-search").click();
        numOfLines = await page.locator('[data-testid^="transcript-frame-"]').count();
        expect(numOfLines).toBeGreaterThan(mockconst.searchTermSize);
    });

    test("keeps search text between tabs", async ({ page }) => {
        await loadInDevmode(page, "mock");

        const searchInput = page.locator("#search-transcript");
        await expect(searchInput).toBeVisible();
        await searchInput.fill(mockconst.searchTerm);

        const paginationTab = page.getByTestId("transcript-tab-pagination");
        const virtualTab = page.getByTestId("transcript-tab-virtual");
        const visualTab = page.getByTestId("transcript-tab-visual");

        // Pagination
        await paginationTab.click();
        let searchText = await searchInput.inputValue();
        expect(searchText).toBe(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();
        let numOfLines = await page.locator('[data-testid^="transcript-line-"]').count();
        expect(numOfLines).toBe(mockconst.searchTermSize);

        // Virtual
        await virtualTab.click();
        searchText = await searchInput.inputValue();
        expect(searchText).toBe(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();
        numOfLines = await page.locator('[data-testid^="transcript-line-"]').count();
        expect(numOfLines).toBe(mockconst.searchTermSize);

        // Visual
        await visualTab.click();
        searchText = await searchInput.inputValue();
        expect(searchText).toBe(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-frame-${mockconst.searchLineId}`)).toBeVisible();
        numOfLines = await page.locator('[data-testid^="transcript-frame-"]').count();
        expect(numOfLines).toBe(mockconst.searchTermSize);
    });

    test("jump to line in virtual views", async ({ page }) => {
        await loadInDevmode(page, "mock");

        const searchInput = page.locator("#search-transcript");
        await expect(searchInput).toBeVisible();

        // Virtual
        const virtualTab = page.getByTestId("transcript-tab-virtual");
        await virtualTab.click();
        await searchInput.fill(mockconst.searchTerm);
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();

        const menuButton = page.getByTestId(`line-button-${mockconst.searchLineId}`);
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        const jumpButton = page.getByText("Jump to line");
        await jumpButton.click();

        // we jump to the top, so the virtual view will not render -1.
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId + 1}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId + 2}`)).toBeVisible();
        expect(await searchInput.inputValue()).toBe("");

        // Visual
        const visualTab = page.getByTestId("transcript-tab-visual");
        await visualTab.click();
        await searchInput.fill(mockconst.searchTerm);

        const frame = page.getByTestId(`transcript-frame-${mockconst.searchLineId}`);
        await expect(frame).toBeVisible();
        await frame.click();
        const frameMenuButton = page.getByTestId(`line-button-${mockconst.searchLineId}`);
        await frameMenuButton.click();
        const frameJumpButton = page.getByText("Jump to line");
        await frameJumpButton.click();

        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId + 1}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.searchLineId + 2}`)).toBeVisible();
        expect(await searchInput.inputValue()).toBe("");
    });

    test("jump to line in pagination view", async ({ page }) => {
        await loadInDevmode(page, "mock");

        const searchInput = page.locator("#search-transcript");
        await expect(searchInput).toBeVisible();

        const paginationTab = page.getByTestId("transcript-tab-pagination");
        await paginationTab.click();

        // Top of page jump
        await searchInput.fill(mockconst.paginationSearchTop);
        const topLine = page.getByTestId(`transcript-line-${mockconst.paginationTopLineId}`);
        await expect(topLine).toBeVisible();
        const topMenuButton = page.getByTestId(`line-button-${mockconst.paginationTopLineId}`);
        await topMenuButton.click();
        const topJumpButton = page.getByText("Jump to line");
        await topJumpButton.click();

        await expect(page.getByTestId(`transcript-line-${mockconst.paginationTopLineId}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationTopLineId - 1}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationTopLineId - 2}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationTopLineId + 1}`)).not.toBeVisible();
        expect(await searchInput.inputValue()).toBe("");

        // Bottom of page jump
        await searchInput.fill(mockconst.paginationSearchBottom);
        const bottomLine = page.getByTestId(`transcript-line-${mockconst.paginationBottomLineId}`);
        await expect(bottomLine).toBeVisible();
        const bottomMenuButton = page.getByTestId(`line-button-${mockconst.paginationBottomLineId}`);
        await bottomMenuButton.click();
        const bottomJumpButton = page.getByText("Jump to line");
        await bottomJumpButton.click();

        await expect(page.getByTestId(`transcript-line-${mockconst.paginationBottomLineId}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationBottomLineId + 1}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationBottomLineId + 2}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationBottomLineId - 1}`)).not.toBeVisible();
        expect(await searchInput.inputValue()).toBe("");

        // Middle of page jump
        await searchInput.fill(mockconst.paginationSearchMiddle);
        const middleLine = page.getByTestId(`transcript-line-${mockconst.paginationMiddleLineId}`);
        await expect(middleLine).toBeVisible();
        const middleMenuButton = page.getByTestId(`line-button-${mockconst.paginationMiddleLineId}`);
        await middleMenuButton.click();
        const middleJumpButton = page.getByText("Jump to line");
        await middleJumpButton.click();

        await expect(page.getByTestId(`transcript-line-${mockconst.paginationMiddleLineId - 2}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationMiddleLineId - 1}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationMiddleLineId}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationMiddleLineId + 1}`)).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.paginationMiddleLineId + 2}`)).toBeVisible();
        expect(await searchInput.inputValue()).toBe("");
    });
});

test.describe("Transcript tabs", () => {
    test("move around transcript", async ({ page }) => {
        await loadInDevmode(page, "mock");

        const paginationTab = page.getByTestId("transcript-tab-pagination");
        const virtualTab = page.getByTestId("transcript-tab-virtual");

        await paginationTab.click();
        const linesPerPage = 300;
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("transcript-pagination").getByRole("button", { name: "2" }).click();
        await expect(
            page.getByTestId(`transcript-line-${mockconst.emptyLineId - (linesPerPage + 1) * 1}`),
        ).toBeVisible();
        await page.getByTestId("transcript-pagination").getByRole("button", { name: "3" }).click();
        await expect(
            page.getByTestId(`transcript-line-${mockconst.emptyLineId - (linesPerPage + 1) * 2}`),
        ).toBeVisible();
        await page.getByTestId('transcript-pagination').getByRole('button', { name: 'Go to next page' }).click();
        await expect(
            page.getByTestId(`transcript-line-${mockconst.emptyLineId - (linesPerPage + 1) * 3}`),
        ).toBeVisible();
        await page.getByTestId('transcript-pagination').getByRole('button', { name: 'Go to last page' }).click();
        await expect(page.getByTestId("transcript-line-0")).toBeVisible();
        await page.getByTestId('transcript-pagination').getByRole('button', { name: 'Go to first page' }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();

        await virtualTab.click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await expect(page.getByTestId("transcript-jumpToBottom")).not.toBeVisible();
        await page.getByTestId("transcript-jumpToTop").click();
        await expect(page.getByTestId("transcript-line-0")).toBeVisible();
        await expect(page.getByTestId("transcript-jumpToBottom")).toBeVisible();
    });

    test("tabs persistence", async ({ page }) => {
        await loadInDevmode(page, "mock");

        const paginationTab = page.getByTestId("transcript-tab-pagination");
        const virtualTab = page.getByTestId("transcript-tab-virtual");
        const visualTab = page.getByTestId("transcript-tab-visual");

        await paginationTab.click();
        await expect(page.getByTestId("transcript-pagination")).toBeVisible();
        await page.reload();
        await expect(page.getByTestId("transcript-pagination")).toBeVisible();

        await virtualTab.click();
        await expect(page.getByTestId("transcript-virtual-toolbar")).toBeVisible();
        await page.reload();
        await expect(page.getByTestId("transcript-virtual-toolbar")).toBeVisible();

        // virtual to frame
        await virtualTab.click();
        await visualTab.click();
        await expect(page.getByTestId("transcript-virtual-toolbar")).not.toBeVisible();
        await expect(page.getByTestId("transcript-pagination")).not.toBeVisible();
        await page.reload();
        await expect(page.getByTestId("transcript-virtual-toolbar")).toBeVisible();
        await expect(page.getByTestId("transcript-pagination")).not.toBeVisible();

        // pagination to frame
        await paginationTab.click();
        await visualTab.click();
        await expect(page.getByTestId("transcript-virtual-toolbar")).not.toBeVisible();
        await expect(page.getByTestId("transcript-pagination")).not.toBeVisible();
        await page.reload();
        await expect(page.getByTestId("transcript-virtual-toolbar")).not.toBeVisible();
        await expect(page.getByTestId("transcript-pagination")).toBeVisible();
    });

    test("virtual transcript handles pause and play", async ({ page, isMobile }) => {
        await loadInDevmode(page, "mock");

        const searchInput = page.locator("#search-transcript");
        await expect(searchInput).toBeVisible();

        const virtualTab = page.getByTestId("transcript-tab-virtual");

        // Virtual shows offline and live correctly
        await virtualTab.click();
        await setStreamLive(page, isMobile, false);
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Offline")).toBeVisible();
        await setStreamLive(page, isMobile, true);
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Live")).toBeVisible();
        await searchInput.fill("asdf");
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Searching")).toBeVisible();
        await page.getByTestId("clear-search").click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("transcript-jumpToTop").click();
        await expect(page.getByTestId("transcript-line-0")).toBeVisible();
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Paused")).toBeVisible();

        // Virtual stays paused when new lines are added
        await simulateLive(page, isMobile, mockconst.emptyLineId + 1, 100);
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Paused")).toBeVisible();
        await page.waitForTimeout(1000);
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Paused")).toBeVisible();
        await expect(page.getByTestId("transcript-line-0")).toBeVisible();
        await page.getByTestId("transcript-virtual-toolbar").getByText("Paused").click();
        await page.waitForTimeout(1000);
        await expect(page.getByTestId("transcript-virtual-toolbar").getByText("Live")).toBeVisible();
    });

    test("shows frame when mediatype is video", async ({ page, isMobile }) => {
        await loadInDevmode(page, "mock");

        const searchInput = page.locator("#search-transcript");
        await expect(searchInput).toBeVisible();

        await setMediaType(page, isMobile, "None");
        await expect(page.getByTestId("transcript-tab-visual")).not.toBeVisible();
        await setMediaType(page, isMobile, "Audio");
        await expect(page.getByTestId("transcript-tab-visual")).not.toBeVisible();
        await setMediaType(page, isMobile, "Video");
        await expect(page.getByTestId("transcript-tab-visual")).toBeVisible();
        await page.getByTestId("transcript-tab-visual").click();
        await expect(page.getByTestId(`transcript-frame-${mockconst.emptyLineId}`)).toBeVisible();
        await setMediaType(page, isMobile, "Audio");
        await expect(page.getByTestId("transcript-tab-visual")).not.toBeVisible();
        await expect(page.getByTestId("transcript-virtual-toolbar")).toBeVisible();
    });
});

test.describe("Transcript frame", () => {
    test("frame controlls", async ({ page }, testInfo) => {
        await loadInDevmode(page, "mock");
        await page.getByTestId("transcript-tab-visual").click();
        await expect(page.getByTestId(`transcript-frame-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId(`transcript-frame-${mockconst.emptyLineId}`).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.keyboard.press("ArrowLeft");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId - 1}`)).toBeVisible();
        await takeScreenshots(page, testInfo, "transcript-frame");
        await page.keyboard.press("ArrowRight");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
    });
});

test.describe("Transcript line", () => {
    test("tag helper", async ({ page }, testInfo) => {
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        const line = page.getByTestId(`transcript-line-${mockconst.emptyLineId}`);
        const segment = line.getByTestId("transcript-segment-0");
        await expect(segment).toBeVisible();
        await segment.click();
        await expect(page.getByText("Tag Offset Calculator")).toBeVisible();
        await takeScreenshots(page, testInfo, "tag-offset-calculator");
    });

    test("disables audio when mediatype is none", async ({ page, isMobile }, testInfo) => {
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await setMediaType(page, isMobile, "Audio");
        const button = page.getByTestId(`line-button-${mockconst.emptyLineId}`);
        await button.click();
        const menu = page.getByTestId("line-menu");
        await expect(menu).toBeVisible();
        await expect(menu.getByText("Start Clip")).toBeVisible();
        await expect(menu.getByText("Download Audio")).toBeVisible();
        await expect(menu.getByText("Play Audio")).toBeVisible();
        await takeScreenshots(page, testInfo, "line-menu-audio");
        await page.keyboard.press("Escape");

        await setMediaType(page, isMobile, "None");
        await button.click();
        await expect(menu.getByText("Start Clip")).not.toBeVisible();
        await expect(menu.getByText("Download Audio")).not.toBeVisible();
        await expect(menu.getByText("Play Audio")).not.toBeVisible();
        await takeScreenshots(page, testInfo, "line-menu-none");
    });
});

test.describe("Transcript clipping", () => {
    test("clip mode changes line buttons and colors", async ({ page }, testInfo) => {
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();
        await expect(
            page.getByTestId(`line-button-${mockconst.emptyLineId}`).getByTestId("ContentCutIcon"),
        ).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );

        await page.getByTestId(`line-button-${mockconst.emptyLineId}`).click();
        await expect(
            page.getByTestId(`line-button-${mockconst.emptyLineId}`).getByTestId("RestartAltIcon"),
        ).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).not.toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
        await takeScreenshots(page, testInfo, "clip-mode-line-start");

        await page.getByTestId("clip-mode-button").click();
        await expect(
            page.getByTestId(`line-button-${mockconst.emptyLineId}`).getByTestId("MoreHorizIcon"),
        ).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
    });

    test("clip mode reset clip", async ({ page }) => {
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
        await page.getByTestId(`line-button-${mockconst.emptyLineId}`).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).not.toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
        await page.getByTestId(`line-button-${mockconst.emptyLineId}`).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
    });

    test("clip range", async ({ page, isMobile }) => {
        await loadInDevmode(page, "mock");
        // Use pagination since every line is rendered, making this test easier to do.
        await page.getByTestId("transcript-tab-pagination").click();
        await page.getByTestId('transcript-pagination').getByRole('button', { name: 'Go to last page' }).click();
        await expect(page.getByTestId("transcript-line-0")).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        // 30 lines up should make the first line outside the clip.
        await page.getByTestId(`line-button-30`).click();
        await expect(page.getByTestId(`line-button-0`)).toBeDisabled();
        await expect(page.getByTestId(`line-button-1`)).toBeEnabled();
        await expect(page.getByTestId(`line-button-59`)).toBeEnabled();
        await expect(page.getByTestId(`line-button-60`)).toBeDisabled();

        // if a line doesn't have media available, then it should act as the border.
        await setMediaAvailability(page, isMobile, [25, 35], false);
        await expect(page.getByTestId(`line-button-24`)).toBeDisabled();
        await expect(page.getByTestId(`line-button-25-loading`)).toBeDisabled();
        await expect(page.getByTestId(`line-button-26`)).toBeEnabled();
        await expect(page.getByTestId(`line-button-34`)).toBeEnabled();
        await expect(page.getByTestId(`line-button-35-loading`)).toBeDisabled();
        await expect(page.getByTestId(`line-button-36`)).toBeDisabled();
    });

    test("canceling reset clip state", async ({ page }) => {
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 1}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();
        await page.getByRole("button", { name: "Cancel" }).click();

        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
        await expect(
            page.getByTestId(`line-button-${mockconst.emptyLineId}`).getByTestId("MoreHorizIcon"),
        ).toBeVisible();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId - 1}`)).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
        await expect(
            page.getByTestId(`line-button-${mockconst.emptyLineId - 1}`).getByTestId("MoreHorizIcon"),
        ).toBeVisible();
    });

    test("handle errors", async ({ page }, testInfo) => {
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 1}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();
        await takeScreenshots(page, testInfo, "clip-editor");

        await page.getByRole("button", { name: "Direct Download" }).click();
        await expect(page.getByText("Please select a format.")).toBeVisible({ timeout: 15_000 });
        await page.getByRole("button", { name: "Trim Clip" }).click();
        await expect(page.getByText("Please select a format.")).toBeVisible();
    });

    test("mp3 trim", async ({ page, browserName }, testInfo) => {
        test.skip(browserName !== "chromium", "Clipping is most stable on Chromium");
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 1}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();

        await page.getByRole("textbox", { name: "Clip Name" }).click();
        await page.getByRole("textbox", { name: "Clip Name" }).fill("Clip name");
        await page.getByRole("combobox", { name: "File Format" }).click();
        await page.getByRole("option", { name: "MP3 (Audio)" }).click();

        await page.getByRole("button", { name: "Trim Clip" }).click();
        await expect(page.getByText("Trim your clip")).toBeVisible();
        await page.getByRole("spinbutton", { name: "Start" }).click();
        await page.getByRole("spinbutton", { name: "Start" }).press("ControlOrMeta+a");
        await page.getByRole("spinbutton", { name: "Start" }).fill("2");
        await page.getByRole("spinbutton", { name: "Start" }).press("Enter");
        await page.getByRole("spinbutton", { name: "End" }).click();
        await page.getByRole("spinbutton", { name: "End" }).press("ControlOrMeta+a");
        await page.getByRole("spinbutton", { name: "End" }).fill("4");
        await page.getByRole("spinbutton", { name: "End" }).press("Enter");
        await takeScreenshots(page, testInfo, "clip-trim-mp3");

        await page.getByRole("button", { name: "Download Clip" }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await expect(page.getByText("Clip Editor")).not.toBeVisible();
        await expect(page.getByText("Trim your clip")).not.toBeVisible();
    });

    test("mp3 download", async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Clipping is most stable on Chromium");
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId - 2}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 3}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();

        await page.getByRole("textbox", { name: "Clip Name" }).click();
        await page.getByRole("textbox", { name: "Clip Name" }).fill("Clip name");
        await page.getByRole("combobox", { name: "File Format" }).click();
        await page.getByRole("option", { name: "MP3 (Audio)" }).click();

        await page.getByRole("button", { name: "Direct Download" }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Clip Editor")).not.toBeVisible();
    });

    test("m4a trim", async ({ page, browserName }, testInfo) => {
        test.skip(browserName !== "chromium", "Clipping is most stable on Chromium");
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId - 2}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 3}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();

        await page.getByRole("textbox", { name: "Clip Name" }).click();
        await page.getByRole("textbox", { name: "Clip Name" }).fill("Clip name");
        await page.getByRole("combobox", { name: "File Format" }).click();
        await page.getByRole("option", { name: "M4A (Audio)" }).click();

        await page.getByRole("button", { name: "Trim Clip" }).click();
        await expect(page.getByText("Trim your clip")).toBeVisible();
        await page.getByRole("spinbutton", { name: "Start" }).click();
        await page.getByRole("spinbutton", { name: "Start" }).press("ControlOrMeta+a");
        await page.getByRole("spinbutton", { name: "Start" }).fill("2");
        await page.getByRole("spinbutton", { name: "Start" }).press("Enter");
        await page.getByRole("spinbutton", { name: "End" }).click();
        await page.getByRole("spinbutton", { name: "End" }).press("ControlOrMeta+a");
        await page.getByRole("spinbutton", { name: "End" }).fill("4");
        await page.getByRole("spinbutton", { name: "End" }).press("Enter");
        await takeScreenshots(page, testInfo, "clip-trim-m4a");

        await page.getByRole("button", { name: "Download Clip" }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await expect(page.getByText("Clip Editor")).not.toBeVisible();
        await expect(page.getByText("Trim your clip")).not.toBeVisible();
    });

    test("m4a download", async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Clipping is most stable on Chromium");
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId - 2}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 3}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();

        await page.getByRole("textbox", { name: "Clip Name" }).click();
        await page.getByRole("textbox", { name: "Clip Name" }).fill("Clip name");
        await page.getByRole("combobox", { name: "File Format" }).click();
        await page.getByRole("option", { name: "M4A (Audio)" }).click();

        await page.getByRole("button", { name: "Direct Download" }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Clip Editor")).not.toBeVisible();
    });

    test("mp4 trim", async ({ page, browserName }, testInfo) => {
        test.skip(browserName !== "chromium", "Clipping is most stable on Chromium");
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId - 2}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 3}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();

        await page.getByRole("textbox", { name: "Clip Name" }).click();
        await page.getByRole("textbox", { name: "Clip Name" }).fill("Clip name");
        await page.getByRole("combobox", { name: "File Format" }).click();
        await page.getByRole("option", { name: "MP4 (Video)" }).click();

        await page.getByRole("button", { name: "Trim Clip" }).click();
        await expect(page.getByText("Trim your clip")).toBeVisible();
        await page.getByRole("spinbutton", { name: "Start" }).click();
        await page.getByRole("spinbutton", { name: "Start" }).press("ControlOrMeta+a");
        await page.getByRole("spinbutton", { name: "Start" }).fill("2");
        await page.getByRole("spinbutton", { name: "Start" }).press("Enter");
        await page.getByRole("spinbutton", { name: "End" }).click();
        await page.getByRole("spinbutton", { name: "End" }).press("ControlOrMeta+a");
        await page.getByRole("spinbutton", { name: "End" }).fill("4");
        await page.getByRole("spinbutton", { name: "End" }).press("Enter");
        await takeScreenshots(page, testInfo, "clip-trim-mp4");

        await page.getByRole("button", { name: "Download Clip" }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await expect(page.getByText("Clip Editor")).not.toBeVisible();
        await expect(page.getByText("Trim your clip")).not.toBeVisible();
    });

    test("mp4 download", async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Clipping is most stable on Chromium");
        await loadInDevmode(page, "mock");
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
        await page.getByTestId("clip-mode-button").click();

        await page.getByTestId(`line-button-${mockconst.emptyLineId - 2}`).click();
        await page.getByTestId(`line-button-${mockconst.emptyLineId - 3}`).click();
        await expect(page.getByText("Clip Editor")).toBeVisible();

        await page.getByRole("textbox", { name: "Clip Name" }).click();
        await page.getByRole("textbox", { name: "Clip Name" }).fill("Clip name");
        await page.getByRole("combobox", { name: "File Format" }).click();
        await page.getByRole("option", { name: "MP4 (Video)" }).click();

        await page.getByRole("button", { name: "Direct Download" }).click();
        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Clip Editor")).not.toBeVisible();
    });
});
