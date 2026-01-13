import { test, expect } from "@playwright/test";
import { loadInDevmode } from "./helper";

test("graph page loads", async ({ page }) => {
    await loadInDevmode(page, "mock/graph/");
    await expect(page).toHaveURL(/mock\/graph/);
    await expect(page.getByLabel("Text to search")).toBeVisible();
});
