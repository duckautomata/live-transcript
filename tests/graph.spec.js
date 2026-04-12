import { test, expect } from "./custom-test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mocks/mockconst";

test("graph page loads", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/graph/`);
    await expect(page).toHaveURL(new RegExp(`${mockconst.keyName}/graph/`));
    await expect(page.getByLabel("Search text usage")).toBeVisible();
});
