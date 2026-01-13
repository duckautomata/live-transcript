import { test, expect } from "@playwright/test";
import { loadInDevmode } from "./helper";

test("tag formatter page loads", async ({ page }) => {
    await loadInDevmode(page, "mock/tagFixer/");
    await expect(page).toHaveURL(/mock\/tagFixer/);
    await expect(page.getByRole("textbox")).toBeVisible();
});
