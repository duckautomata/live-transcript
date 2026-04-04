/**
 * @typedef {import("@playwright/test").Page} Page
 * @typedef {import("@playwright/test").TestInfo} TestInfo
 */

import { expect } from "playwright/test";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const devSettings = {
    state: {
        theme: "system",
        density: "standard",
        timeFormat: "relative",
        enableTagHelper: true,
        defaultOffset: "-20",
        sidebarOpen: false,
        devMode: true,
        useVirtualList: true,
    },
    version: 0,
};

/**
 * Load the page in devmode
 * @param {Page} page
 * @param {string} pathUrl
 */
export async function loadInDevmode(page, pathUrl) {
    // We need to first load a page to set the devmode. We use the favicon since this is the lightest page possible.
    // Then we go to the actual page after devmode is set.
    await page.goto("favicon.ico");
    await page.evaluate((value) => {
        window.localStorage.setItem("live-transcript-settings", value);
    }, JSON.stringify(devSettings));

    if (process.env.MOCK_API != "true") {
        await page.goto(pathUrl);
        return;
    }

    // Setup network mocking for a stable testing environment
    const mockDataStr = await fs.readFile(path.resolve(__dirname, "mocks/mockData.json"), "utf8");
    const mockData = JSON.parse(mockDataStr);

    // Mock Websockets
    await page.routeWebSocket(/.*/, (ws) => {
        ws.onMessage(async (msg) => {
            // handle any client-to-server WS messages here if needed (e.g., ping)
            if (typeof msg === "string") {
                try {
                    const parsed = JSON.parse(msg);
                    if (parsed.event === "ping") {
                        ws.send(JSON.stringify({ event: "pong", data: { timestamp: parsed.data.timestamp } }));
                    }
                    // oxlint-disable-next-line no-unused-vars
                } catch (e) {
                    // oxlint-disable-next-line no-empty
                }
            }
        });

        if (mockData.currentStream) {
            const partialSync = { ...mockData.currentStream, event: "partialSync" };
            setTimeout(() => ws.send(JSON.stringify(partialSync)), 10);
            setTimeout(() => ws.send(JSON.stringify(mockData.currentStream)), 100);
        }
        if (mockData.pastStreams) {
            setTimeout(() => ws.send(JSON.stringify(mockData.pastStreams)), 200);
        }
    });

    // Mock Clipping Endpoints
    await page.route("**/clip", async (route) => {
        await route.fulfill({ json: { status: "success", clip_id: "test_clip" } });
    });

    await page.route("**/trim", async (route) => {
        await route.fulfill({ json: { status: "success", clip_id: "test_trimmed_clip" } });
    });

    // Mock Past Transcripts Endpoint
    await page.route("**/transcript/*", async (route) => {
        await route.fulfill({ json: mockData.pastStreamTranscript || {} });
    });

    function getHeaders(route) {
        return route.request().url().includes("download=true") ? { "Content-Disposition": "attachment" } : undefined;
    }

    // Mock Images using a local placeholder image
    const mockImageBuffer = await fs.readFile(path.resolve(__dirname, "mocks/mockImage.jpg"));
    await page.route("**/*.{jpg,png,jpeg}*", async (route) => {
        await route.fulfill({
            body: mockImageBuffer,
            contentType: "image/jpeg",
            headers: getHeaders(route),
        });
    });

    // Mock Audio/Video assets
    const mockAudioMp3Buffer = await fs.readFile(path.resolve(__dirname, "mocks/mockAudio.mp3"));
    await page.route("**/*.mp3*", async (route) => {
        await route.fulfill({
            body: mockAudioMp3Buffer,
            contentType: "audio/mpeg",
            headers: getHeaders(route),
        });
    });

    const mockAudioM4aBuffer = await fs.readFile(path.resolve(__dirname, "mocks/mockAudio.m4a"));
    await page.route("**/*.m4a*", async (route) => {
        await route.fulfill({
            body: mockAudioM4aBuffer,
            contentType: "audio/mp4",
            headers: getHeaders(route),
        });
    });

    const mockVideoMp4Buffer = await fs.readFile(path.resolve(__dirname, "mocks/mockVideo.mp4"));
    await page.route("**/*.mp4*", async (route) => {
        await route.fulfill({
            body: mockVideoMp4Buffer,
            contentType: "video/mp4",
            headers: getHeaders(route),
        });
    });

    await page.goto(pathUrl);
}

/**
 * Wait for the page to be fully synced
 * @param {Page} page
 */
export async function waitForFullSync(page) {
    await expect(page.getByTestId("synced-icon")).toBeVisible();
}

/**
 * Take screenshots of the page in both light and dark mode
 * @param {Page} page
 * @param {TestInfo} testInfo
 * @param {string} name
 */
export async function takeScreenshots(page, testInfo, name) {
    if (process.env.CI) return;

    // Light Mode. We need to wait for the page to update to the color scheme.
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(250);
    await testInfo.attach(`${name}-light`, { body: await page.screenshot(), contentType: "image/png" });

    // Dark Mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(250);
    await testInfo.attach(`${name}-dark`, { body: await page.screenshot(), contentType: "image/png" });
}

/**
 * Set the stream to live or offline
 * @param {Page} page
 * @param {boolean} isMobile
 * @param {boolean} isLive
 */
export async function setStreamLive(page, isMobile, isLive) {
    if (isMobile) {
        await page.getByTestId("sidebar-open-button").click();
    }

    await page.getByTestId("page-button-devTools").click();
    await expect(page.getByTestId("devtools-title")).toBeVisible();
    if (isLive) {
        await page.getByTestId("devtools-is-live").getByRole("switch").check();
    } else {
        await page.getByTestId("devtools-is-live").getByRole("switch").uncheck();
    }
    await expect(page.getByTestId("devtools-is-live").getByRole("switch")).toBeChecked({ checked: isLive });
    await page.getByTestId("devtools-close").click();

    if (isMobile) {
        await page.getByTestId("sidebar-collapse-button").click();
    }
}

/**
 * Simulate live mode
 * @param {Page} page
 * @param {boolean} isMobile
 * @param {number} startId
 * @param {number} interval
 */
export async function simulateLive(page, isMobile, startId, interval) {
    if (isMobile) {
        await page.getByTestId("sidebar-open-button").click();
    }

    await page.getByTestId("page-button-devTools").click();
    await expect(page.getByTestId("devtools-title")).toBeVisible();

    const startIdInput = page.getByTestId("devtools-sim-start-id").getByRole("spinbutton");
    await startIdInput.click();
    await startIdInput.press("ControlOrMeta+a");
    await startIdInput.fill(String(startId));

    const intervalInput = page.getByTestId("devtools-sim-interval").getByRole("spinbutton");
    await intervalInput.click();
    await intervalInput.press("ControlOrMeta+a");
    await intervalInput.fill(String(interval));

    await page.getByTestId("devtools-start-sim").click();
    await page.getByTestId("devtools-close").click();

    if (isMobile) {
        await page.getByTestId("sidebar-collapse-button").click();
    }
}

/**
 * Stop simulate live mode
 * @param {Page} page
 * @param {boolean} isMobile
 */
export async function stopSimulateLive(page, isMobile) {
    if (isMobile) {
        await page.getByTestId("sidebar-open-button").click();
    }

    await page.getByTestId("page-button-devTools").click();
    await expect(page.getByTestId("devtools-title")).toBeVisible();
    await page.getByTestId("devtools-stop-sim").click();
    await page.getByTestId("devtools-close").click();

    if (isMobile) {
        await page.getByTestId("sidebar-collapse-button").click();
    }
}

/**
 * Set the media type
 * @param {Page} page
 * @param {boolean} isMobile
 * @param {"None" | "Audio" | "Video"} mediaType
 */
export async function setMediaType(page, isMobile, mediaType) {
    if (isMobile) {
        await page.getByTestId("sidebar-open-button").click();
    }

    await page.getByTestId("page-button-devTools").click();
    await expect(page.getByTestId("devtools-title")).toBeVisible();
    await page.getByTestId("devtools-media-type").getByRole("combobox").click();
    await page.getByRole("option", { name: mediaType }).click();
    await expect(page.getByTestId("devtools-media-type").getByRole("combobox")).toHaveText(mediaType);
    await page.getByTestId("devtools-close").click();

    if (isMobile) {
        await page.getByTestId("sidebar-collapse-button").click();
    }
}

/**
 * Set the media availability
 * @param {Page} page
 * @param {boolean} isMobile
 * @param {number[]} ids
 * @param {boolean} available
 */
export async function setMediaAvailability(page, isMobile, ids, available) {
    if (isMobile) {
        await page.getByTestId("sidebar-open-button").click();
    }
    await page.getByTestId("page-button-devTools").click();
    await expect(page.getByTestId("devtools-title")).toBeVisible();

    const idsInput = page.getByTestId("devtools-media-ids");
    await idsInput.click();
    await idsInput.press("ControlOrMeta+a");
    await page.keyboard.type(ids.join(","));

    if (available) {
        await page.getByTestId("devtools-media-available").getByRole("switch").check();
    } else {
        await page.getByTestId("devtools-media-available").getByRole("switch").uncheck();
    }

    await page.getByTestId("devtools-set-media-availability").click();

    await page.getByTestId("devtools-close").click();
    if (isMobile) {
        await page.getByTestId("sidebar-collapse-button").click();
    }
}
