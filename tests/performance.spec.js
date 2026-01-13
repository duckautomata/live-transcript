/* eslint-disable no-console */
import { test, expect, devices } from "@playwright/test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mockconst";

test.describe("Performance", () => {
    // defaults for Pixel 5 but without defaultBrowserType which causes error in test.use
    const { defaultBrowserType, ...pixel5 } = devices["Pixel 5"];
    console.log(`defaultBrowserType: ${defaultBrowserType}`);

    test.use({
        ...pixel5,
        isMobile: true,
    });

    test("load transcript page on slow 4G", async ({ page, context, browserName }) => {
        // CDP is only supported on Chromium
        test.skip(browserName !== "chromium", "Network emulation requires CDP (Chromium)");

        // Stimulate 4G
        // Playwright uses CDP session for network conditions
        const client = await context.newCDPSession(page);
        await client.send("Network.enable");
        await client.send("Network.emulateNetworkConditions", {
            offline: false,
            latency: 100, // ms
            downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps (Regular 4G)
            uploadThroughput: (3 * 1024 * 1024) / 8, // 3 Mbps
            connectionType: "cellular4g",
        });

        const startTime = Date.now();
        await loadInDevmode(page, "mock");
        const loadTime = Date.now() - startTime;

        console.log(`Load time on 4G: ${loadTime}ms`);

        // Assert it loads within a reasonable timeframe (e.g., 20s for slow connection)
        await expect(page.getByRole("textbox", { name: "Search Transcript" })).toBeVisible({ timeout: 30000 });

        // Assert loaded
        await expect(page).toHaveURL(/mock/);

        await expect(page.getByTestId(`transcript-line-${mockconst.emptyLineId}`)).toBeVisible();
    });
});
