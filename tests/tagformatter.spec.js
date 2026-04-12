import { test, expect } from "./custom-test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mocks/mockconst";

test.describe("Tag Formatter", () => {
    test("can load", async ({ page }) => {
        await loadInDevmode(page, `${mockconst.keyName}/tagFixer/`);
        await expect(page).toHaveURL(new RegExp(`${mockconst.keyName}/tagFixer/`));
        await expect(page.getByRole("textbox")).toBeVisible();
    });
});
