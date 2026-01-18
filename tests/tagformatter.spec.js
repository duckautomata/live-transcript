import { test, expect } from "@playwright/test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mockconst";

test("tag formatter page loads", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/tagFixer/`);
    await expect(page).toHaveURL(new RegExp(`${mockconst.keyName}/tagFixer/`));
    await expect(page.getByRole("textbox")).toBeVisible();
});
