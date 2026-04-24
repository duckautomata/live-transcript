import { test, expect } from "./custom-test";
import { loadInDevmode, waitForFullSync } from "./helper";
import * as mockconst from "./mocks/mockconst";

const pagePath = `${mockconst.keyName}/tagFixer/`;
const homePath = mockconst.keyName;
const birthdayText = "Dragoon Birthdays";

const sampleCollectionInput = [
    "00:30 Funny Moments :: dokibird laughs",
    "01:00 Funny Moments :: dokibird laughs again",
    "02:15 Deaths :: first death",
    "03:00 [Intro] start of stream",
    "04:00 normal tag here",
    "05:30 HBD somebody",
].join("\n");

const getInputField = (page) => page.getByTestId("tag-input-field").locator("textarea").first();

const fillInput = async (page, text) => {
    const input = getInputField(page);
    await input.click();
    await input.fill(text);
};

const formatTags = async (page) => {
    await page.getByTestId("tag-format-btn").click();
    // If a re-format dialog appears, confirm it.
    const dialogConfirm = page.getByRole("button", { name: "Format" });
    if (await dialogConfirm.isVisible().catch(() => false)) {
        await dialogConfirm.click();
    }
    await expect(page.getByText("Formatted Tags")).toBeVisible();
};

test.describe("Tag Formatter Input Page", () => {
    test("can load and input field accepts text", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await expect(page).toHaveURL(new RegExp(`${mockconst.keyName}/tagFixer/`));
        const input = getInputField(page);
        await expect(input).toBeVisible();
        await input.fill("00:15 test tag");
        await expect(input).toHaveValue("00:15 test tag");
    });

    test("Format / Clear buttons respond to input state", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        // Initially empty: Format hidden, Clear disabled
        await expect(page.getByTestId("tag-format-btn")).not.toBeVisible();
        const clearBtn = page.getByTestId("tag-clear-input-btn");
        await expect(clearBtn).toBeDisabled();

        // Typing enables both
        await fillInput(page, "00:10 hello world");
        await expect(page.getByTestId("tag-format-btn")).toBeVisible();
        await expect(clearBtn).toBeEnabled();

        // Clearing resets the input
        await clearBtn.click();
        await expect(getInputField(page)).toHaveValue("");
        await expect(page.getByTestId("tag-format-btn")).not.toBeVisible();
    });

    test("Reset Data shows confirmation dialog", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await page.getByTestId("tag-reset-btn").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("heading", { name: "Clear Data" })).toBeVisible();
        await expect(dialog.getByText("Are you sure you want to clear all tags?")).toBeVisible();
        await dialog.locator("button").first().click();
        await expect(dialog).not.toBeVisible();
    });

    test("Format transitions to Formatted view and exposes action buttons", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await expect(page.getByTestId("tag-format-clipboard-btn")).toBeVisible();
        await fillInput(page, "00:10 simple tag");
        await formatTags(page);
        await expect(page.getByTestId("tag-back-input-btn")).toBeVisible();
        await expect(page.getByTestId("tag-copy-btn")).toBeVisible();
    });

    test("whitespace-only input does not enable Format", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "   \n   \n");
        await expect(page.getByTestId("tag-format-btn")).not.toBeVisible();
    });
});

test.describe("Tag Formatter Formatted Page", () => {
    test("renders headers, rows, and controls for collections, chapters, normals, HBDs", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, sampleCollectionInput);
        await formatTags(page);

        // Headers
        await expect(page.getByTestId("tag-header-Funny Moments")).toBeVisible();
        await expect(page.getByTestId("tag-header-Deaths")).toBeVisible();
        await expect(page.getByTestId("tag-header-Intro")).toBeVisible();
        await expect(page.getByTestId(`tag-header-${birthdayText}`)).toBeVisible();

        // Normal tag is visible in body
        await expect(page.getByText("normal tag here")).toBeVisible();

        // Controls for each type
        await expect(page.getByTestId("tag-control-collection-Funny Moments")).toBeVisible();
        await expect(page.getByTestId("tag-control-collection-Deaths")).toBeVisible();
        await expect(page.getByTestId("tag-control-chapter-Intro")).toBeVisible();
        await expect(page.getByTestId(`tag-control-hbd-${birthdayText}`)).toBeVisible();
    });

    test("headers display names wrapped in asterisks", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 Fights :: boss\n00:20 [Intro] begin\n00:30 HBD alice");
        await formatTags(page);

        await expect(page.getByTestId("tag-header-Fights")).toContainText("*Fights*");
        await expect(page.getByTestId("tag-header-Intro")).toContainText("*Intro*");
        await expect(page.getByTestId(`tag-header-${birthdayText}`)).toContainText(`*${birthdayText}*`);
    });

    test("format list order: collections at top, chapters/tags middle (sorted), HBD at bottom", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            [
                "03:00 [Second Chapter] tag",
                "04:00 normal second",
                "01:00 Deaths :: one",
                "02:00 Deaths :: two",
                "00:30 [First Chapter] tag",
                "01:30 normal first",
                "05:00 HBD alice",
                "06:00 HBD bob",
            ].join("\n"),
        );
        await formatTags(page);

        // Both collection tags should come before any chapter header (they are at the top)
        const deathsHeader = page.getByTestId("tag-header-Deaths");
        const firstChapter = page.getByTestId("tag-header-First Chapter");
        const secondChapter = page.getByTestId("tag-header-Second Chapter");
        const hbdHeader = page.getByTestId(`tag-header-${birthdayText}`);

        // Collection header should be first
        await expect(deathsHeader).toBeVisible();
        await expect(firstChapter).toBeVisible();
        await expect(secondChapter).toBeVisible();
        await expect(hbdHeader).toBeVisible();

        // All headers in format list, in DOM order
        const allHeaders = page.locator('[data-testid^="tag-header-"]');
        await expect(allHeaders.nth(0)).toHaveAttribute("data-row-subtype", "collection");
        // First chapter (00:30) comes before second chapter (03:00)
        await expect(allHeaders.nth(1)).toHaveAttribute("data-testid", "tag-header-First Chapter");
        await expect(allHeaders.nth(2)).toHaveAttribute("data-testid", "tag-header-Second Chapter");
        // HBD always last
        await expect(allHeaders.last()).toHaveAttribute("data-row-subtype", "hbd");
    });

    test("header list order: collections top, chapters middle (sorted by time), HBD bottom", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            [
                "00:10 Alpha :: a1",
                "03:00 [Third Chapter] t",
                "01:00 [First Chapter] t",
                "00:20 Beta :: b1",
                "02:00 [Second Chapter] t",
                "05:00 HBD alice",
            ].join("\n"),
        );
        await formatTags(page);

        // Select only the outer control Box containers, not the nested move-up/move-down buttons.
        const controls = page.locator(
            '[data-testid^="tag-control-collection-"], [data-testid^="tag-control-chapter-"], [data-testid^="tag-control-hbd-"]',
        );

        await expect(controls.nth(0)).toHaveAttribute("data-testid", "tag-control-collection-Alpha");
        await expect(controls.nth(1)).toHaveAttribute("data-testid", "tag-control-collection-Beta");
        await expect(controls.nth(2)).toHaveAttribute("data-testid", "tag-control-chapter-First Chapter");
        await expect(controls.nth(3)).toHaveAttribute("data-testid", "tag-control-chapter-Second Chapter");
        await expect(controls.nth(4)).toHaveAttribute("data-testid", "tag-control-chapter-Third Chapter");
        await expect(controls.nth(5)).toHaveAttribute("data-testid", `tag-control-hbd-${birthdayText}`);
    });

    test("chapters in format list are sorted by time", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            ["03:00 [Later Chapter] c", "01:00 [Earlier Chapter] a", "02:00 [Middle Chapter] b"].join("\n"),
        );
        await formatTags(page);

        const chapterHeaders = page.locator('[data-row-subtype="chapter"][data-testid^="tag-header-"]');
        await expect(chapterHeaders.nth(0)).toHaveAttribute("data-testid", "tag-header-Earlier Chapter");
        await expect(chapterHeaders.nth(1)).toHaveAttribute("data-testid", "tag-header-Middle Chapter");
        await expect(chapterHeaders.nth(2)).toHaveAttribute("data-testid", "tag-header-Later Chapter");
    });

    test("birthday tags sorted by time at bottom of format list", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, ["05:00 HBD zara", "01:00 HBD alice", "03:00 HBD bob"].join("\n"));
        await formatTags(page);

        // HBD header plus tags all have data-row-subtype="hbd"
        const hbdRows = page.locator('[data-row-subtype="hbd"]');
        // First is the header
        await expect(hbdRows.nth(0)).toHaveAttribute("data-testid", `tag-header-${birthdayText}`);
        // Tags sorted by time
        const hbdTagRows = page.locator('[data-testid="tag-row"][data-row-subtype="hbd"]');
        await expect(hbdTagRows.nth(0)).toContainText("alice");
        await expect(hbdTagRows.nth(1)).toContainText("bob");
        await expect(hbdTagRows.nth(2)).toContainText("zara");
    });

    test("Back to Input returns to input view", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 sample");
        await formatTags(page);
        await page.getByTestId("tag-back-input-btn").click();
        await expect(page.getByTestId("tag-input-field")).toBeVisible();
    });

    test("Copy to Clipboard writes formatted output", async ({ browser, browserName }) => {
        // Webkit rejects the "clipboard-write" permission and also blocks
        // navigator.clipboard.readText() in automation. On webkit we only assert the
        // UI feedback; on other browsers we additionally verify the clipboard content.
        const isWebkit = browserName === "webkit";
        const permissions = isWebkit ? [] : ["clipboard-read", "clipboard-write"];
        const context = await browser.newContext({ permissions });
        const page = await context.newPage();
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 sample tag");
        await formatTags(page);

        await page.getByTestId("tag-copy-btn").click();
        await expect(page.getByText("Copied!")).toBeVisible();

        if (!isWebkit) {
            const clipboard = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboard).toContain("00:10 sample tag");
        }
        await context.close();
    });

    test("row checkbox toggles tag enabled state", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 disable me\n00:20 keep me");
        await formatTags(page);

        const row = page.getByTestId("tag-row").filter({ hasText: "disable me" });
        await expect(row).toHaveAttribute("data-row-enabled", "true");
        await row.getByRole("checkbox").click();
        await expect(row).toHaveAttribute("data-row-enabled", "false");
    });

    test("edit tag row and save updates the text", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 before edit");
        await formatTags(page);

        const row = page.getByTestId("tag-row");
        await expect(row).toHaveCount(1);
        await row.getByRole("button").click();
        const editInput = row.getByRole("textbox").nth(1);
        await editInput.fill("after edit");
        await editInput.press("Enter");

        await expect(row).toContainText("after edit");
        await expect(row).not.toContainText("before edit");
    });

    test("toggling collection control hides header and moves tags to timeline", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 Group :: first\n00:20 Group :: second");
        await formatTags(page);

        const control = page.getByTestId("tag-control-collection-Group");
        await expect(control).toBeVisible();
        await control.getByRole("checkbox").click();
        await expect(page.getByTestId("tag-header-Group")).not.toBeVisible();
    });

    test("move collection up/down changes control order", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 Alpha :: a1\n00:20 Beta :: b1");
        await formatTags(page);

        const items = page.locator('[data-testid^="tag-control-collection-"]');
        await expect(items.nth(0)).toHaveAttribute("data-testid", "tag-control-collection-Alpha");
        await expect(items.nth(1)).toHaveAttribute("data-testid", "tag-control-collection-Beta");

        await page.getByTestId("tag-control-move-down-Alpha").click();
        await expect(items.nth(0)).toHaveAttribute("data-testid", "tag-control-collection-Beta");
        await expect(items.nth(1)).toHaveAttribute("data-testid", "tag-control-collection-Alpha");

        await page.getByTestId("tag-control-move-up-Alpha").click();
        await expect(items.nth(0)).toHaveAttribute("data-testid", "tag-control-collection-Alpha");
        await expect(items.nth(1)).toHaveAttribute("data-testid", "tag-control-collection-Beta");
    });

    test("edit chapter text updates header and control", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 [Original Name] begin");
        await formatTags(page);

        const header = page.getByTestId("tag-header-Original Name");
        await header.getByRole("button").click();
        const editInput = header.getByRole("textbox").last();
        await editInput.fill("Renamed Chapter");
        await editInput.press("Enter");

        await expect(page.getByTestId("tag-header-Renamed Chapter")).toBeVisible();
        await expect(page.getByTestId("tag-control-chapter-Renamed Chapter")).toBeVisible();
        await expect(page.getByTestId("tag-header-Original Name")).not.toBeVisible();
    });

    test("editing chapter timestamp re-parents child tags", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        // Chapter at 01:00 with child tag at 01:30, then another chapter at 02:00.
        // Moving the first chapter to 02:30 should cause the 01:30 tag to re-parent (orphan it).
        await fillInput(
            page,
            ["01:00 [First Chapter] start", "01:30 child tag of first", "02:00 [Second Chapter] start"].join("\n"),
        );
        await formatTags(page);

        const childRow = page.getByTestId("tag-row").filter({ hasText: "child tag of first" });
        await expect(childRow).toHaveAttribute("data-row-parent-name", "First Chapter");

        // Edit First Chapter timestamp to 03:00 so child at 01:30 is now before it.
        const header = page.getByTestId("tag-header-First Chapter");
        await header.getByRole("button").click();
        const timestampInput = header.getByRole("textbox").first();
        await timestampInput.fill("03:00");
        await timestampInput.press("Enter");

        // Child at 01:30 should now be under Second Chapter (which starts at 02:00) or no parent (before any chapter)
        // At 01:30, before Second Chapter (02:00), so no chapter parent.
        await expect(childRow).not.toHaveAttribute("data-row-parent-name", "First Chapter");
    });

    test("disabling all tags in a chapter crosses out the control", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        // No inline chapter text — only the header and one child tag at 01:30.
        await fillInput(page, "01:00 [Short Chapter]\n01:30 only child");
        await formatTags(page);

        const control = page.getByTestId("tag-control-chapter-Short Chapter");
        await expect(control).toHaveAttribute("data-control-crossed-out", "false");

        // Disable the only tag belonging to the chapter
        const childRow = page.getByTestId("tag-row").filter({ hasText: "only child" });
        await childRow.getByRole("checkbox").click();

        await expect(control).toHaveAttribute("data-control-crossed-out", "true");
    });

    test("disabling collection control hides header and tags appear in timeline as loose tags", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            ["00:30 [Opening] begin", "01:00 Deaths :: first", "01:30 Deaths :: second", "02:00 normal tag"].join("\n"),
        );
        await formatTags(page);

        // Initially, the collection header is rendered
        await expect(page.getByTestId("tag-header-Deaths")).toBeVisible();

        // Disable Deaths
        await page.getByTestId("tag-control-collection-Deaths").getByRole("checkbox").click();

        // Header hidden; tags still visible in timeline
        await expect(page.getByTestId("tag-header-Deaths")).not.toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "first" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "second" })).toBeVisible();
    });

    test("hovering over a tag highlights its parent header and control", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "01:00 [Chapter One] begin\n01:30 child tag");
        await formatTags(page);

        const childRow = page.getByTestId("tag-row").filter({ hasText: "child tag" });
        const header = page.getByTestId("tag-header-Chapter One");
        const control = page.getByTestId("tag-control-chapter-Chapter One");

        // Not highlighted initially
        await expect(header).toHaveAttribute("data-row-highlighted-parent", "false");
        await expect(control).toHaveAttribute("data-control-hovered", "false");

        // Hover over the tag
        await childRow.hover();
        await expect(header).toHaveAttribute("data-row-highlighted-parent", "true");
        await expect(control).toHaveAttribute("data-control-hovered", "true");
    });

    test("clicking a control title highlights the format list header temporarily", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "01:00 [Some Chapter] begin\n01:30 child");
        await formatTags(page);

        const header = page.getByTestId("tag-header-Some Chapter");
        await expect(header).toHaveAttribute("data-row-highlighted", "false");

        // Click the control title (Typography inside the control)
        await page.getByTestId("tag-control-chapter-Some Chapter").getByText("Some Chapter").click();
        await expect(header).toHaveAttribute("data-row-highlighted", "true");
    });

    test("output has empty-line separators between sections and excludes disabled rows", async ({
        browser,
        browserName,
    }) => {
        const isWebkit = browserName === "webkit";
        if (isWebkit) return;
        const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
        const page = await context.newPage();
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            [
                "00:10 Groups :: g1",
                "00:20 Groups :: disabled gone",
                "00:30 [Chapter One] begin",
                "00:40 chapter child",
                "01:00 HBD alice",
            ].join("\n"),
        );
        await formatTags(page);

        // Disable one of the group tags to verify it's excluded
        const disabledRow = page.getByTestId("tag-row").filter({ hasText: "disabled gone" });
        await disabledRow.getByRole("checkbox").click();

        await page.getByTestId("tag-copy-btn").click();
        await expect(page.getByText("Copied!")).toBeVisible();

        const clipboard = await page.evaluate(() => navigator.clipboard.readText());

        // Disabled row excluded
        expect(clipboard).not.toContain("disabled gone");

        // Header titles wrapped in **
        expect(clipboard).toContain("*Groups*");
        expect(clipboard).toContain("*Chapter One*");
        expect(clipboard).toContain(`*${birthdayText}*`);

        // Empty-line separators: collection block should be separated from following sections by blank lines.
        // The output should have an empty line before the first chapter header AND before the HBD section.
        // We check that "*Chapter One*" is preceded by a blank line, and "*Dragoon Birthdays*" by a blank line.
        expect(clipboard).toMatch(/\n\s*\n\*Chapter One\*/);
        expect(clipboard).toMatch(new RegExp(`\\n\\s*\\n\\*${birthdayText}\\*`));

        await context.close();
    });

    test("output reflects edited tag text", async ({ browser, browserName }) => {
        const isWebkit = browserName === "webkit";
        if (isWebkit) return;
        const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
        const page = await context.newPage();
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 original");
        await formatTags(page);

        // Edit the tag
        const row = page.getByTestId("tag-row");
        await row.getByRole("button").click();
        const editInput = row.getByRole("textbox").nth(1);
        await editInput.fill("edited output");
        await editInput.press("Enter");

        await page.getByTestId("tag-copy-btn").click();
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard).toContain("edited output");
        expect(clipboard).not.toContain("original");
        await context.close();
    });
});

test.describe("Tag Formatter Re-input and Edit Input", () => {
    test("Return to Formatted / Append / Re-Format buttons behave correctly", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 first");
        await formatTags(page);
        await page.getByTestId("tag-back-input-btn").click();

        // Return to Formatted works
        await expect(page.getByTestId("tag-return-formatted-btn")).toBeVisible();
        await expect(page.getByTestId("tag-append-btn")).toBeVisible();

        // Clear input: Append disappears, Return still visible
        await page.getByTestId("tag-clear-input-btn").click();
        await expect(page.getByTestId("tag-append-btn")).not.toBeVisible();
        await expect(page.getByTestId("tag-return-formatted-btn")).toBeVisible();

        // Type again: Append reappears, Format becomes Re-Format
        await fillInput(page, "00:20 second");
        await expect(page.getByTestId("tag-append-btn")).toBeVisible();
        await page.getByTestId("tag-format-btn").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("heading", { name: "Re-Format Tags" })).toBeVisible();
        await dialog.locator("button").first().click();
        await expect(dialog).not.toBeVisible();
    });

    test("Append merges new tags into existing formatted rows", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 first tag");
        await formatTags(page);
        await page.getByTestId("tag-back-input-btn").click();

        await fillInput(page, "00:20 second tag");
        await page.getByTestId("tag-append-btn").click();

        await expect(page.getByTestId("tag-row").filter({ hasText: "first tag" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "second tag" })).toBeVisible();
    });

    test("Reset Data from input clears formatted rows too", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 sample");
        await formatTags(page);
        await page.getByTestId("tag-back-input-btn").click();

        await expect(page.getByTestId("tag-return-formatted-btn")).toBeVisible();
        await page.getByTestId("tag-reset-btn").click();
        await page.getByRole("button", { name: "Clear" }).click();

        await expect(page.getByTestId("tag-return-formatted-btn")).not.toBeVisible();
        await expect(getInputField(page)).toHaveValue("");
    });

    test("editing a tag then navigating back to input preserves both edits and original input", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 original text");
        await formatTags(page);

        // Edit the tag text
        const row = page.getByTestId("tag-row");
        await row.getByRole("button").click();
        const editInput = row.getByRole("textbox").nth(1);
        await editInput.fill("edited text");
        await editInput.press("Enter");
        await expect(row).toContainText("edited text");

        // Back to input - original input still there
        await page.getByTestId("tag-back-input-btn").click();
        await expect(getInputField(page)).toHaveValue("00:10 original text");

        // Return to Formatted - edited text is preserved
        await page.getByTestId("tag-return-formatted-btn").click();
        await expect(page.getByTestId("tag-row")).toContainText("edited text");
    });
});

test.describe("Tag Formatter Parsing Edge Cases", () => {
    test("same-name and fuzzy-matched collections merge under one header/control", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            [
                "00:10 Funny Moments :: one",
                "00:20 funnymoments :: two",
                "00:30 FUNNY MOMENTS :: three",
                "00:40 Deaths :: only death",
            ].join("\n"),
        );
        await formatTags(page);

        // Funny Moments variants merge into one control entry
        const funnyControls = page.locator('[data-testid^="tag-control-collection-"]').filter({ hasText: /Funny/i });
        await expect(funnyControls).toHaveCount(1);

        // All three tags rendered
        await expect(page.getByTestId("tag-row").filter({ hasText: "one" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "two" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "three" })).toBeVisible();

        // Deaths gets its own control
        await expect(page.getByTestId("tag-control-collection-Deaths")).toBeVisible();
    });

    test("chapter parsing creates header with timestamp prefix", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 [Chapter One] begin");
        await formatTags(page);

        const header = page.getByTestId("tag-header-Chapter One");
        await expect(header).toBeVisible();
        await expect(header).toHaveText(/00:10/);
        await expect(header).toHaveText(/Chapter One/);
    });

    test("HBD tags are moved into birthdays section", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 normal tag\n01:00 HBD alice\n02:00 HBD bob");
        await formatTags(page);

        await expect(page.getByTestId(`tag-header-${birthdayText}`)).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "alice" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "bob" })).toBeVisible();
    });

    test("empty/whitespace lines are ignored and tags sort by timestamp", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "02:00 later\n\n   \n00:10 earlier\n01:00 middle");
        await formatTags(page);

        const rows = page.getByTestId("tag-row");
        await expect(rows).toHaveCount(3);
        await expect(rows.nth(0)).toContainText("earlier");
        await expect(rows.nth(1)).toContainText("middle");
        await expect(rows.nth(2)).toContainText("later");
    });

    test("timestamp normalization handles many input formats", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        // Each line uses a unique trailing keyword so we can identify the resulting row.
        const cases = [
            { input: "00:00 aaa", keyword: "aaa", expected: "00:01" },
            { input: "00:00:00 bbb", keyword: "bbb", expected: "00:00:01" },
            { input: "5 ccc", keyword: "ccc", expected: "00:05" },
            { input: "15 ddd", keyword: "ddd", expected: "00:15" },
            { input: "30s eee", keyword: "eee", expected: "00:30" },
            { input: "05m30s fff", keyword: "fff", expected: "05:30" },
            { input: "01h05m30s ggg", keyword: "ggg", expected: "01:05:30" },
            { input: "1:02:03 iii", keyword: "iii", expected: "1:02:03" },
        ];
        await fillInput(page, cases.map((c) => c.input).join("\n"));
        await formatTags(page);

        for (const { keyword, expected } of cases) {
            await expect(page.getByTestId("tag-row").filter({ hasText: keyword })).toHaveAttribute(
                "data-row-timestamp",
                expected,
            );
        }
    });

    test("censored text is applied and flagged via Highlight Censored", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        // "kill" -> "take out", "stupid" -> "unsmart". "clean tag" passes through unchanged.
        await fillInput(
            page,
            ["00:10 going to kill the boss", "00:20 so stupid right now", "00:30 clean tag"].join("\n"),
        );
        await formatTags(page);

        // Censoring visible in row text
        await expect(page.getByTestId("tag-row").filter({ hasText: "take out" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "unsmart" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "clean tag" })).toBeVisible();

        // Flip on Highlight Censored — it's the 2nd switch in the Bulk Edit panel
        const bulkPaper = page.locator(".MuiPaper-root", { hasText: "Bulk Edit" });
        const censoredSwitch = bulkPaper.getByRole("switch").nth(1);
        await censoredSwitch.check();

        // The "X found" counter should report 2 (two censored rows, not three)
        await expect(bulkPaper.getByText("2 found")).toBeVisible();
    });

    test("complex mixed input parses collections, chapters, HBDs, and normals together", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            [
                "00:10 Deaths :: fell off cliff",
                "00:20 [Opening] getting started",
                "00:30 a plain tag",
                "00:45 Deaths :: shot by enemy",
                "01:00 [Boss Fight] first boss",
                "01:15 another plain",
                "02:00 HBD alice",
            ].join("\n"),
        );
        await formatTags(page);

        // Collections
        await expect(page.getByTestId("tag-header-Deaths")).toHaveCount(1);
        await expect(page.getByTestId("tag-row").filter({ hasText: "fell off cliff" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "shot by enemy" })).toBeVisible();

        // Chapters
        await expect(page.getByTestId("tag-header-Opening")).toBeVisible();
        await expect(page.getByTestId("tag-header-Boss Fight")).toBeVisible();

        // Normal tags remain
        await expect(page.getByTestId("tag-row").filter({ hasText: "a plain tag" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "another plain" })).toBeVisible();

        // HBD
        await expect(page.getByTestId(`tag-header-${birthdayText}`)).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "alice" })).toBeVisible();
    });
});

test.describe("Tag Formatter Persistence", () => {
    test("formatted rows, input, and controls survive a page reload", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 Group :: survive me\n00:20 normal persists");
        await formatTags(page);

        // Disable a control to confirm control state persists
        await page.getByTestId("tag-control-collection-Group").getByRole("checkbox").click();
        await expect(page.getByTestId("tag-header-Group")).not.toBeVisible();

        await page.reload();

        // Formatted view and rows restored
        await expect(page.getByText("Formatted Tags")).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "normal persists" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "survive me" })).toBeVisible();

        // Disabled control is still disabled (header hidden)
        await expect(page.getByTestId("tag-header-Group")).not.toBeVisible();

        // Input text persists too
        await page.getByTestId("tag-back-input-btn").click();
        await expect(getInputField(page)).toHaveValue("00:10 Group :: survive me\n00:20 normal persists");
    });
});

test.describe("Tag Formatter Keyboard Shortcuts", () => {
    test("Enter saves an edit and Escape cancels it", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 original");
        await formatTags(page);

        const row = page.getByTestId("tag-row");

        // Enter saves
        await row.getByRole("button").click();
        const editInput1 = row.getByRole("textbox").nth(1);
        await editInput1.fill("saved via enter");
        await editInput1.press("Enter");
        await expect(row).toContainText("saved via enter");

        // Escape discards
        await row.getByRole("button").click();
        const editInput2 = row.getByRole("textbox").nth(1);
        await editInput2.fill("this should be discarded");
        await editInput2.press("Escape");
        await expect(row).toContainText("saved via enter");
        await expect(row).not.toContainText("this should be discarded");
    });
});

test.describe("Tag Formatter Bulk Edit", () => {
    test("offset add/subtract shifts timestamps only within range", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 first\n00:30 second\n02:00 third");
        await formatTags(page);

        await page.getByRole("button", { name: "Offset Timestamps" }).click();

        // Add
        await page.getByTestId("tag-offset-start").locator("input").fill("00:00");
        await page.getByTestId("tag-offset-end").locator("input").fill("01:00");
        await page.getByTestId("tag-offset-amount").locator("input").fill("00:05");
        await page.getByTestId("tag-offset-add").click();

        await expect(page.getByTestId("tag-row").filter({ hasText: "first" })).toHaveAttribute(
            "data-row-timestamp",
            "00:15",
        );
        await expect(page.getByTestId("tag-row").filter({ hasText: "second" })).toHaveAttribute(
            "data-row-timestamp",
            "00:35",
        );
        await expect(page.getByTestId("tag-row").filter({ hasText: "third" })).toHaveAttribute(
            "data-row-timestamp",
            "02:00",
        );

        // Subtract
        await page.getByTestId("tag-offset-subtract").click();
        await expect(page.getByTestId("tag-row").filter({ hasText: "first" })).toHaveAttribute(
            "data-row-timestamp",
            "00:10",
        );
        await expect(page.getByTestId("tag-row").filter({ hasText: "second" })).toHaveAttribute(
            "data-row-timestamp",
            "00:30",
        );
    });

    test("Find & Replace handles matches and no-matches", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 hello world\n00:20 hello again");
        await formatTags(page);

        await page.getByRole("button", { name: /Find .* Replace/ }).click();

        // Matches
        await page.getByTestId("tag-find-text").locator("input").fill("hello");
        await page.getByTestId("tag-replace-text").locator("input").fill("hi");
        await page.getByTestId("tag-replace-all-btn").click();

        await expect(page.getByText(/Replaced 2 instances\./)).toBeVisible();
        await page.getByRole("button", { name: "OK" }).click();

        await expect(page.getByTestId("tag-row").filter({ hasText: "hi world" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "hi again" })).toBeVisible();

        // No matches
        await page.getByTestId("tag-find-text").locator("input").fill("nonexistent");
        await page.getByTestId("tag-replace-all-btn").click();
        await expect(page.getByText("No matches found.")).toBeVisible();
    });

    test("Enable/Disable range toggles isEnabled within the range only", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 a\n00:30 b\n02:00 c");
        await formatTags(page);

        await page.getByRole("button", { name: "Enable / Disable Range" }).click();

        await page.getByTestId("tag-enable-start").locator("input").fill("00:00");
        await page.getByTestId("tag-enable-end").locator("input").fill("01:00");
        await page.getByTestId("tag-disable-btn").click();

        await expect(page.getByTestId("tag-row").filter({ hasText: "a" })).toHaveAttribute("data-row-enabled", "false");
        await expect(page.getByTestId("tag-row").filter({ hasText: "b" })).toHaveAttribute("data-row-enabled", "false");
        await expect(page.getByTestId("tag-row").filter({ hasText: "c" })).toHaveAttribute("data-row-enabled", "true");

        await page.getByTestId("tag-enable-btn").click();
        await expect(page.getByTestId("tag-row").filter({ hasText: "a" })).toHaveAttribute("data-row-enabled", "true");
        await expect(page.getByTestId("tag-row").filter({ hasText: "b" })).toHaveAttribute("data-row-enabled", "true");
    });

    test("Highlight Star flags tags containing * and shows count", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 has a * star\n00:20 plain tag\n00:30 another * one");
        await formatTags(page);

        // Before toggling: no highlighted rows
        const starRow = page.getByTestId("tag-row").filter({ hasText: "has a * star" });
        await expect(starRow).toHaveAttribute("data-row-highlighted", "false");

        await page.getByTestId("tag-highlight-star").locator("input").check();
        await expect(page.getByTestId("tag-highlight-star-count")).toContainText("2 found");

        // Starred rows now marked
        await expect(starRow).toHaveAttribute("data-row-highlighted", "true");
        await expect(page.getByTestId("tag-row").filter({ hasText: "plain tag" })).toHaveAttribute(
            "data-row-highlighted",
            "false",
        );
    });

    test("Highlight Caps flags all-caps tags and shows count", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 LOUD TAG HERE\n00:20 quiet tag\n00:30 ANOTHER LOUD");
        await formatTags(page);

        await page.getByTestId("tag-highlight-caps").locator("input").check();
        await expect(page.getByTestId("tag-highlight-caps-count")).toContainText("2 found");

        await expect(page.getByTestId("tag-row").filter({ hasText: "LOUD TAG HERE" })).toHaveAttribute(
            "data-row-highlighted",
            "true",
        );
        await expect(page.getByTestId("tag-row").filter({ hasText: "quiet tag" })).toHaveAttribute(
            "data-row-highlighted",
            "false",
        );
    });

    test("Highlighted row's original-text is recorded for tooltip", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        // "kill" -> "take out" via genericCensor
        await fillInput(page, "00:10 going to kill the boss");
        await formatTags(page);

        const row = page.getByTestId("tag-row").filter({ hasText: "take out" });
        // Original input is preserved in data-row-original-text
        await expect(row).toHaveAttribute("data-row-original-text", "going to kill the boss");
    });

    test("bulk edit updates highlight counts live after edits", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 has *\n00:20 no star");
        await formatTags(page);

        await page.getByTestId("tag-highlight-star").locator("input").check();
        await expect(page.getByTestId("tag-highlight-star-count")).toContainText("1 found");

        // Edit "no star" to add a *
        const noStar = page.getByTestId("tag-row").filter({ hasText: "no star" });
        await noStar.getByRole("button").click();
        const editInput = noStar.getByRole("textbox").nth(1);
        await editInput.fill("no star *");
        await editInput.press("Enter");

        await expect(page.getByTestId("tag-highlight-star-count")).toContainText("2 found");
    });
});

test.describe("Tag Formatter Integration with Transcript", () => {
    // emptyLineId (1519) is always visible by default in every view since pagination, virtual,
    // and visual all start at the bottom/newest of the transcript.
    const visibleLineId = mockconst.emptyLineId;

    const seedTags = async (page) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            ["01:00 Deaths :: first death", "02:00 [Opening] begin here", "05:13 a plain normal tag"].join("\n"),
        );
        await formatTags(page);
    };

    test("transcript views render with formatted tags in state", async ({ page }) => {
        await seedTags(page);
        await page.goto(homePath);
        await waitForFullSync(page);

        // Pagination
        await page.getByTestId("transcript-tab-pagination").click();
        await expect(page.getByTestId(`transcript-line-${visibleLineId}`)).toBeVisible();

        // Virtual
        await page.getByTestId("transcript-tab-virtual").click();
        await expect(page.getByTestId(`transcript-line-${visibleLineId}`)).toBeVisible();

        // Visual (frames)
        await page.getByTestId("transcript-tab-visual").click();
        await expect(page.getByTestId(`transcript-frame-${visibleLineId}`)).toBeVisible();
    });

    test("create a normal tag from a transcript segment (pagination view)", async ({ page }) => {
        await seedTags(page);
        await page.goto(homePath);
        await waitForFullSync(page);

        await page.getByTestId("transcript-tab-pagination").click();
        await expect(page.getByTestId(`transcript-line-${visibleLineId}`)).toBeVisible();

        const segment = page
            .getByTestId(`transcript-line-${visibleLineId}`)
            .locator('[data-testid^="transcript-segment-"]')
            .first();
        await segment.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("tab", { name: "Create Tag" }).click();
        await dialog.getByLabel("Tag Text").fill("newly added normal");
        await dialog.getByRole("button", { name: "Create Tag" }).click();
        await expect(dialog).not.toBeVisible();

        await page.goto(pagePath);
        await expect(page.getByTestId("tag-row").filter({ hasText: "newly added normal" })).toBeVisible();
    });

    test("create a chapter from a transcript segment (virtual view)", async ({ page }) => {
        await seedTags(page);
        await page.goto(homePath);
        await waitForFullSync(page);

        await page.getByTestId("transcript-tab-virtual").click();
        await expect(page.getByTestId(`transcript-line-${visibleLineId}`)).toBeVisible();

        const segment = page
            .getByTestId(`transcript-line-${visibleLineId}`)
            .locator('[data-testid^="transcript-segment-"]')
            .first();
        await segment.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("tab", { name: "Create Tag" }).click();
        await dialog.getByRole("radio", { name: "Chapter" }).click();
        const chapterField = dialog.getByLabel("Chapter Name");
        await chapterField.fill("Newly Made Chapter");
        // Close the autocomplete dropdown so it does not intercept the button click
        await chapterField.press("Escape");
        await dialog.getByRole("button", { name: "Create Tag" }).click();
        await expect(dialog).not.toBeVisible();

        await page.goto(pagePath);
        await expect(page.getByTestId("tag-header-Newly Made Chapter")).toBeVisible();
        await expect(page.getByTestId("tag-control-chapter-Newly Made Chapter")).toBeVisible();
    });

    test("create a group tag from a transcript frame (visual view)", async ({ page }) => {
        await seedTags(page);
        await page.goto(homePath);
        await waitForFullSync(page);

        await page.getByTestId("transcript-tab-visual").click();
        const frame = page.getByTestId(`transcript-frame-${visibleLineId}`);
        await expect(frame).toBeVisible();
        await frame.click();

        // Frame opens a dialog containing a Line with segments — click a segment to open TagOffsetPopup
        const frameDialog = page.getByRole("dialog");
        await expect(frameDialog).toBeVisible();
        const segmentInDialog = frameDialog.locator('[data-testid^="transcript-segment-"]').first();
        await segmentInDialog.click();

        // Now a second dialog (TagOffsetPopup) is open on top.
        const tagDialog = page.getByRole("dialog").last();
        await tagDialog.getByRole("tab", { name: "Create Tag" }).click();
        await tagDialog.getByLabel("Tag Text").fill("group-tag-from-visual");
        await tagDialog.getByRole("radio", { name: "Group" }).click();
        const groupField = tagDialog.getByLabel("Group Name");
        await groupField.fill("VisualGroup");
        // Close the autocomplete dropdown so it does not intercept the button click
        await groupField.press("Escape");
        await tagDialog.getByRole("button", { name: "Create Tag" }).click();

        await page.goto(pagePath);
        await expect(page.getByTestId("tag-header-VisualGroup")).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "group-tag-from-visual" })).toBeVisible();
    });

    test("chapter name uniqueness check is case-insensitive", async ({ page }) => {
        // Seed an existing chapter
        await loadInDevmode(page, pagePath);
        await fillInput(page, "01:00 [Opening] begin here");
        await formatTags(page);

        await page.goto(homePath);
        await waitForFullSync(page);

        await page.getByTestId("transcript-tab-pagination").click();
        const segment = page
            .getByTestId(`transcript-line-${visibleLineId}`)
            .locator('[data-testid^="transcript-segment-"]')
            .first();
        await segment.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("tab", { name: "Create Tag" }).click();
        await dialog.getByRole("radio", { name: "Chapter" }).click();
        const chapterField = dialog.getByLabel("Chapter Name");
        // Use a different case of the existing chapter
        await chapterField.fill("opening");

        // Expectation per guide: case-insensitive uniqueness — should error out and disable Create
        await expect(dialog.getByText("Chapter name already exists")).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Create Tag" })).toBeDisabled();
    });
});

test.describe("Tag Formatter Parsing Duplicate Chapters", () => {
    test("duplicate chapter names (case-insensitive) are combined into one", async ({ page }) => {
        await loadInDevmode(page, pagePath);
        await fillInput(
            page,
            [
                "01:00 [Opening] first tag",
                "01:30 [opening] same chapter different case",
                "02:00 [OPENING] third variant",
            ].join("\n"),
        );
        await formatTags(page);

        // Guide: "Prevent duplicate chapter names from being created. If there are duplicate names in the input,
        //        then combine them together into one chapter. Case insensitive."
        // Only one chapter should exist; first name wins
        const chapterControls = page.locator('[data-testid^="tag-control-chapter-"]');
        await expect(chapterControls).toHaveCount(1);
        await expect(page.getByTestId("tag-control-chapter-Opening")).toBeVisible();

        // All three rows should appear under that one chapter
        await expect(page.getByTestId("tag-row").filter({ hasText: "first tag" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "same chapter different case" })).toBeVisible();
        await expect(page.getByTestId("tag-row").filter({ hasText: "third variant" })).toBeVisible();
    });
});

test.describe("Tag Formatter Transcript Segment Tooltip", () => {
    const visibleLineId = mockconst.emptyLineId;

    // Tag tooltips per guide:
    //   Tag:        [timestamp] text
    //   Birthday:   Birthday: [timestamp] text
    //   Chapter:    chapter: text
    //   Group tag:  collection: group name [timestamp] text

    // Seed some tags first so the Create Tag tab exists when a segment is clicked
    const seedBase = async (page) => {
        await loadInDevmode(page, pagePath);
        await fillInput(page, "00:10 seed tag");
        await formatTags(page);
    };

    test("normal tag tooltip shows [timestamp] text", async ({ page }) => {
        await seedBase(page);
        await page.goto(homePath);
        await waitForFullSync(page);
        await page.getByTestId("transcript-tab-pagination").click();
        const segment = page
            .getByTestId(`transcript-line-${visibleLineId}`)
            .locator('[data-testid^="transcript-segment-"]')
            .first();
        await segment.click();

        const dialog = page.getByRole("dialog");
        await dialog.getByRole("tab", { name: "Create Tag" }).click();
        await dialog.getByLabel("Tag Text").fill("a normal tag here");
        await dialog.getByRole("button", { name: "Create Tag" }).click();
        await expect(dialog).not.toBeVisible();

        await segment.hover();
        const tooltip = page.getByRole("tooltip");
        await expect(tooltip).toContainText("a normal tag here");
        await expect(tooltip).toContainText(/\[\d+:\d+/);
    });

    test("chapter tooltip shows 'chapter:' prefix", async ({ page }) => {
        await seedBase(page);
        await page.goto(homePath);
        await waitForFullSync(page);
        await page.getByTestId("transcript-tab-pagination").click();
        const segment = page
            .getByTestId(`transcript-line-${visibleLineId}`)
            .locator('[data-testid^="transcript-segment-"]')
            .first();
        await segment.click();

        const dialog = page.getByRole("dialog");
        await dialog.getByRole("tab", { name: "Create Tag" }).click();
        await dialog.getByRole("radio", { name: "Chapter" }).click();
        const chapterField = dialog.getByLabel("Chapter Name");
        await chapterField.fill("Intro Chapter");
        await chapterField.press("Escape");
        await dialog.getByRole("button", { name: "Create Tag" }).click();
        await expect(dialog).not.toBeVisible();

        await segment.hover();
        const tooltip = page.getByRole("tooltip");
        await expect(tooltip).toContainText(/chapter:/i);
        await expect(tooltip).toContainText("Intro Chapter");
    });

    test("group tag tooltip shows 'collection: group name [timestamp] text'", async ({ page }) => {
        await seedBase(page);
        await page.goto(homePath);
        await waitForFullSync(page);
        await page.getByTestId("transcript-tab-pagination").click();
        const segment = page
            .getByTestId(`transcript-line-${visibleLineId}`)
            .locator('[data-testid^="transcript-segment-"]')
            .first();
        await segment.click();

        const dialog = page.getByRole("dialog");
        await dialog.getByRole("tab", { name: "Create Tag" }).click();
        await dialog.getByLabel("Tag Text").fill("fell off the map");
        await dialog.getByRole("radio", { name: "Group" }).click();
        const groupField = dialog.getByLabel("Group Name");
        await groupField.fill("Deaths");
        await groupField.press("Escape");
        await dialog.getByRole("button", { name: "Create Tag" }).click();
        await expect(dialog).not.toBeVisible();

        await segment.hover();
        const tooltip = page.getByRole("tooltip");
        await expect(tooltip).toContainText(/collection:/i);
        await expect(tooltip).toContainText("Deaths");
        await expect(tooltip).toContainText("fell off the map");
        await expect(tooltip).toContainText(/\[\d+:\d+/);
    });

    test("collection header does not duplicate its first tag's tooltip", async ({ page }) => {
        // Two tags in the same group — the first shares its timestamp with the header row,
        // which previously caused the tooltip to render `collection: g1collection: g1 [...] ...`.
        await loadInDevmode(page, pagePath);
        await fillInput(page, "2:05:00 group1 :: tag one\n2:06:00 group1 :: tag two");
        await formatTags(page);

        await page.goto(homePath);
        await waitForFullSync(page);
        await page.getByTestId("transcript-tab-pagination").click();

        const targetLineId = 1250; // ~2:05:00
        const targetLine = page.getByTestId(`transcript-line-${targetLineId}`);
        await expect(targetLine).toBeVisible();

        let tooltipText = null;
        for (let delta = 0; delta < 5 && tooltipText === null; delta++) {
            for (const sign of [0, -1, 1]) {
                if (sign === 0 && delta !== 0) continue;
                const line = page.getByTestId(`transcript-line-${targetLineId + sign * delta}`);
                if (!(await line.isVisible().catch(() => false))) continue;
                const segs = line.locator('[data-testid^="transcript-segment-"]');
                const count = await segs.count();
                for (let i = 0; i < count; i++) {
                    await segs.nth(i).hover();
                    const tooltip = page.getByRole("tooltip");
                    try {
                        await expect(tooltip).toBeVisible({ timeout: 1500 });
                        const text = (await tooltip.textContent()) ?? "";
                        if (/tag one/.test(text)) {
                            tooltipText = text;
                            break;
                        }
                    } catch {
                        // keep scanning
                    }
                    await page.mouse.move(0, 0);
                }
                if (tooltipText !== null) break;
            }
        }

        expect(tooltipText).not.toBeNull();
        // Exactly one "collection:" prefix — the header shouldn't add a second one.
        const matches = tooltipText.match(/collection:/gi) || [];
        expect(matches.length).toBe(1);
        expect(tooltipText).toMatch(/collection:\s*group1\s*\[\d+:\d+:\d+\]\s*tag one/);
    });

    test("birthday tooltip shows 'Birthday:' prefix", async ({ page }) => {
        // Seed via input so an HBD tag exists in the timeline.
        // Use a relative timestamp that lands within the default pagination window
        // (last ~300 lines, roughly 2:01:54 to 2:31:53 offset in mock data).
        await loadInDevmode(page, pagePath);
        await fillInput(page, "2:05:00 HBD alice");
        await formatTags(page);

        // Verify it's actually classified as HBD in the formatter
        await expect(page.getByTestId(`tag-header-${birthdayText}`)).toBeVisible();

        await page.goto(homePath);
        await waitForFullSync(page);
        await page.getByTestId("transcript-tab-pagination").click();

        // The HBD tag at 2:05:00 (relative) should land on line 1250 in the default
        // pagination page (last ~300 lines, offsets 2:01:54–2:31:53 in mock data).
        const targetLineId = 1250;
        const targetLine = page.getByTestId(`transcript-line-${targetLineId}`);
        await expect(targetLine).toBeVisible();
        // Any segment on/near the target line should have a pink underline for the HBD tag.
        // Scan ±2 lines to absorb any binary-search rounding in View.jsx.
        let found = false;
        for (let delta = 0; delta < 5 && !found; delta++) {
            for (const sign of [0, -1, 1]) {
                if (sign === 0 && delta !== 0) continue;
                const lid = targetLineId + sign * delta;
                const line = page.getByTestId(`transcript-line-${lid}`);
                if (!(await line.isVisible().catch(() => false))) continue;
                const segs = line.locator('[data-testid^="transcript-segment-"]');
                const count = await segs.count();
                for (let i = 0; i < count; i++) {
                    await segs.nth(i).hover();
                    const tooltip = page.getByRole("tooltip");
                    try {
                        await expect(tooltip).toBeVisible({ timeout: 1500 });
                        const text = (await tooltip.textContent()) ?? "";
                        if (/Birthday:/i.test(text)) {
                            found = true;
                            break;
                        }
                    } catch {
                        // no tooltip on this segment; keep scanning
                    }
                    await page.mouse.move(0, 0);
                }
                if (found) break;
            }
        }
        expect(found).toBe(true);
    });
});
