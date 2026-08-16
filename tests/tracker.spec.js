import { test, expect } from "./custom-test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mocks/mockconst";

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
 * @returns {object[]}
 */
function seededHistory() {
    const deltas = [-3, 12, 0, 5, -1, 20, 8, 2, -6, 15, 4, 0, 9, -2, 18, 6, 1, 11, -4, 7];
    const records = [];
    let day = 1;
    for (let i = 0; i < deltas.length; i++) {
        const secondStreamOfDay = i === 4 || i === 9;
        if (!secondStreamOfDay) day += 1;
        const scheduledMs = Date.UTC(2026, 4, day, secondStreamOfDay ? 18 : 24, 0, 0);
        records.push({
            streamId: `seed-${String(i).padStart(2, "0")}`,
            streamName: `Seeded stream ${i}`,
            platform: "YouTube",
            scheduledMs,
            actualMs: scheduledMs + deltas[i] * 60000,
        });
    }
    return records.sort((a, b) => a.scheduledMs - b.scheduledMs);
}

/**
 * Seed the persisted lateness history and reload so the tracker renders it.
 * @param {import("@playwright/test").Page} page
 */
async function loadWithSeededHistory(page) {
    // Establishes devmode and the network mocks.
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await page.getByTestId("tracker-history-table").waitFor();

    // Seed before any page script runs. The store persists itself on every write,
    // so seeding while the tracker is mounted lets its own write clobber ours.
    await page.addInitScript(
        ({ key, records }) => {
            const raw = window.localStorage.getItem("live-transcript-settings");
            const stored = raw ? JSON.parse(raw) : { state: {}, version: 0 };
            stored.state.latenessHistory = { [key]: records };
            window.localStorage.setItem("live-transcript-settings", JSON.stringify(stored));
        },
        { key: mockconst.keyName, records: seededHistory() },
    );

    await page.reload();
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

    await pickScheduleScenario(page, "Countdown — next stream in 30 minutes");

    const card = page.getByTestId("tracker-countdown-card");
    await expect(card).toBeVisible();
    await expect(card).toContainText("Next Stream In");
    await expect(card).toContainText("[mock] Upcoming stream");
});

test("schedule scenario is not persisted and resets on refresh", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await page.getByTestId("tracker-page").waitFor();

    await pickScheduleScenario(page, "Countdown — next stream in 30 minutes");
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

test("mocked schedules are never saved to the punctuality history", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/track/`);
    await page.getByTestId("tracker-page").waitFor();
    // Let the real (mocked-server) records persist first.
    await expect(page.getByTestId("tracker-history-table").locator("tbody tr")).toHaveCount(3);

    const readHistory = () =>
        page.evaluate(() => JSON.parse(window.localStorage.getItem("live-transcript-settings")).state.latenessHistory);
    const before = await readHistory();

    await pickScheduleScenario(page, "Lateness — current stream started 8m late");
    await expect(page.getByTestId("tracker-lateness-card")).toContainText("Started Late by");

    expect(await readHistory()).toEqual(before);
});
