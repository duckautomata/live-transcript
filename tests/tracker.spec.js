import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { test, expect } from "./custom-test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mocks/mockconst";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("tracker page loads", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await expect(page).toHaveURL(new RegExp(`${mockconst.keyName}/track/`));
    await expect(page.getByTestId("tracker-page")).toBeVisible();
    await expect(page.getByText("Stream Tracker")).toBeVisible();
    await expect(page.getByTestId("tracker-status-chip")).toBeVisible();
});

test("tracker shows how late the current stream started", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);

    const card = page.getByTestId("tracker-lateness-card");
    await expect(card).toBeVisible();
    // The mocked stream was scheduled for 5:00 PM PT and started 8m15s later.
    await expect(card).toContainText("Started Late by");
    await expect(card).toContainText("8m 15s");
});

test("tracker lists punctuality history for matched streams", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);

    const table = page.getByTestId("tracker-history-table");
    await expect(table).toBeVisible();
    // Three of the mocked streams (current + two past) appear in the mock schedule.
    await expect(table.locator("tbody tr")).toHaveCount(3);
    await expect(table).toContainText("+8m 15s");
    await expect(table).toContainText("+14m 09s");
    await expect(table).toContainText("+2m 33s");
});

/**
 * 20 synthetic tracked streams. Two of them share a calendar day with the stream
 * before them, so their chart labels repeat -- that duplication used to collapse
 * the band scale and slide every later bar out from under its own hit area.
 * @returns {{ csvRows: string[], pastStreams: object[] }} Schedule rows plus the
 *   server's past-stream entries that give each one an actual start.
 */
function seededHistory() {
    const deltas = [-3, 12, 0, 5, -1, 20, 8, 2, -6, 15, 4, 0, 9, -2, 18, 6, 1, 11, -4, 7];
    const csvRows = [];
    const pastStreams = [];
    let day = 1;
    for (let i = 0; i < deltas.length; i++) {
        const secondStreamOfDay = i === 4 || i === 9;
        if (!secondStreamOfDay) day += 1;
        const streamId = `seed-${String(i).padStart(2, "0")}`;
        const streamName = `Seeded stream ${i}`;
        // May 2026 is PDT (UTC-7): 11 AM PT is 18:00 UTC, 5 PM PT is 24:00 UTC.
        const timePT = secondStreamOfDay ? "11:00:00 AM" : "5:00:00 PM";
        const scheduledMs = Date.UTC(2026, 4, day, secondStreamOfDay ? 18 : 24, 0, 0);
        const actualMs = scheduledMs + deltas[i] * 60000;

        csvRows.push(`${streamId},${streamName},YouTube,5/${day}/2026,${timePT}`);
        pastStreams.push({
            channelId: "doki",
            streamId,
            streamTitle: streamName,
            startTime: String(actualMs / 1000),
            isLive: false,
            mediaType: "video",
            activatedTime: actualMs * 1000,
        });
    }
    return { csvRows, pastStreams };
}

/**
 * Load the tracker with the seeded streams added to the mocked server data.
 * @param {import("@playwright/test").Page} page
 */
async function loadWithSeededHistory(page) {
    const { csvRows, pastStreams } = seededHistory();
    const baseCsv = await fs.readFile(path.resolve(__dirname, "mocks/mockSchedule.csv"), "utf8");

    await loadInDevmode(page, `${mockconst.keyName}/track/`, async (page, mockData) => {
        // Registered after the helper's schedule mock, so this one wins.
        await page.route("**/*.csv", async (route) => {
            await route.fulfill({ body: `${baseCsv.trimEnd()}\n${csvRows.join("\n")}\n`, contentType: "text/csv" });
        });
        mockData.pastStreams.data.streams.push(...pastStreams);
    });
    await page.getByTestId("tracker-history-table").waitFor();
}

test("tracker history table is not truncated", async ({ page }) => {
    await loadWithSeededHistory(page);

    // 20 seeded streams plus the 3 the mock server supplies.
    await expect(page.getByTestId("tracker-history-table").locator("tbody tr")).toHaveCount(23);
});

test("delay chart highlights the bar under the cursor", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    await loadWithSeededHistory(page);

    // MUI X internal class names; update these if the chart library is upgraded.
    const bars = page.locator("rect.MuiBarChart-element");
    await expect(bars).toHaveCount(23);
    const barCount = await bars.count();
    await bars.first().scrollIntoViewIfNeeded();
    // Let the entry animation settle so bounding boxes are final.
    await page.waitForTimeout(600);

    // Check bars after the duplicated dates, where the offset used to accumulate.
    for (const index of [0, 11, barCount - 1]) {
        const box = await bars.nth(index).boundingBox();
        const barCentre = box.x + box.width / 2;
        await page.mouse.move(barCentre, box.y + box.height / 2);

        const highlightCentre = await page.evaluate(async () => {
            await new Promise((resolve) => window.requestAnimationFrame(resolve));
            const el = document.querySelector(".MuiChartsAxisHighlight-root");
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return rect.x + rect.width / 2;
        });

        expect(highlightCentre, `no highlight rendered for bar ${index}`).not.toBeNull();
        // The highlight band must sit over the bar the cursor is on.
        expect(Math.abs(highlightCentre - barCentre), `bar ${index} highlight is offset`).toBeLessThan(box.width);
    }
});

/**
 * Pick a Dev Tools schedule scenario by its visible label.
 * @param {import("@playwright/test").Page} page
 * @param {string} label
 */
async function pickScheduleScenario(page, label) {
    // On mobile the sidebar is a temporary drawer, so open it to reach Dev Tools.
    const hamburger = page.getByTestId("sidebar-open-button");
    const onMobile = await hamburger.isVisible();
    if (onMobile) await hamburger.click();

    await page.getByTestId("page-button-devTools").click();
    await expect(page.getByTestId("devtools-title")).toBeVisible();
    await page.getByTestId("devtools-schedule-mock").click();
    const listbox = page.getByRole("listbox");
    await listbox.waitFor();
    await page.getByRole("option", { name: label }).click();
    // The Select popover animates out; wait for it or it swallows the next input.
    await expect(listbox).toBeHidden();

    // Escape rather than the Close button: on small viewports the dialog content
    // scrolls under the pointer and the button click never lands.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("devtools-title")).toBeHidden();

    if (onMobile) await page.getByTestId("sidebar-collapse-button").click();
}

test("dev tools schedule scenario drives the tracker", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await page.getByTestId("tracker-page").waitFor();

    await pickScheduleScenario(page, "Countdown - next stream in 30 minutes");

    const card = page.getByTestId("tracker-countdown-card");
    await expect(card).toBeVisible();
    await expect(card).toContainText("Next Stream In");
    await expect(card).toContainText("[mock] Upcoming stream");
});

test("schedule scenario is not persisted and resets on refresh", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await page.getByTestId("tracker-page").waitFor();

    await pickScheduleScenario(page, "Countdown - next stream in 30 minutes");
    await expect(page.getByTestId("tracker-countdown-card")).toBeVisible();

    // Dev-tool state must stay out of the persisted settings.
    const persisted = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem("live-transcript-settings")).state,
    );
    expect(persisted).not.toHaveProperty("scheduleMock");

    // A refresh therefore returns to the real (mocked-server) schedule.
    await page.reload();
    await expect(page.getByTestId("tracker-lateness-card")).toBeVisible();
    await expect(page.getByTestId("tracker-countdown-card")).toBeHidden();
});

test("punctuality history is not persisted", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await expect(page.getByTestId("tracker-history-table").locator("tbody tr")).toHaveCount(3);

    // The history is rebuilt from server data on every load, never saved.
    const persisted = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem("live-transcript-settings")).state,
    );
    expect(persisted).not.toHaveProperty("latenessHistory");
});
