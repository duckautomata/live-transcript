import { test, expect } from "./custom-test";
import { loadInDevmode } from "./helper";
import * as mockconst from "./mocks/mockconst";

const hook = "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
const hookToken = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";

const detectionStatus = {
    enabled: true,
    state: "ok",
    watching: ["twitch", "youtube"],
    legs: [
        { mechanism: "twitch-eventsub", state: "ok", lastSuccess: 1 },
        { mechanism: "youtube-state-poll", state: "ok", lastSuccess: 1 },
    ],
    queueIncoming: true,
    detections: [
        {
            platform: "twitch",
            broadcastId: "31337",
            channelKey: mockconst.keyName,
            url: "https://twitch.tv/example",
            title: "A mocked stream",
            startedAt: 1_700_000_000,
            detectedAt: 1_700_000_003,
            mechanism: "twitch-eventsub",
            endedAt: 0,
        },
    ],
    videos: [],
};

const vocabulary = {
    triggers: [
        {
            id: "live",
            label: "Going live",
            description: "A stream starts.",
            headline: "Stream Started",
            platforms: ["twitch", "youtube"],
        },
        {
            id: "scheduled",
            label: "Stream or premiere scheduled",
            description: "A waiting room appears.",
            headline: "Stream Scheduled",
            platforms: ["youtube"],
        },
        {
            id: "upload",
            label: "Video uploaded",
            description: "A video is published.",
            headline: "New Video",
            platforms: ["youtube"],
        },
        {
            id: "short",
            label: "Short uploaded",
            description: "A short is published.",
            headline: "New Short",
            platforms: ["youtube"],
        },
    ],
    placeholders: [
        { name: "{channel}", description: "The channel's display name." },
        { name: "{title}", description: "The stream or video title." },
        { name: "{url}", description: "Link to the stream or video." },
    ],
    defaults: {
        content: "",
        embedEnabled: true,
        embed: {
            title: "{channel}'s {headline}",
            description: "**{title}**\n\n[Open on {platform}]({url})",
            url: "{url}",
            color: "#2ECC71",
            image: "{thumbnail}",
            thumbnail: "",
            footer: "",
            timestamp: true,
        },
        cooldownSeconds: 300,
    },
    limits: {
        name: 80,
        content: 2000,
        embedTitle: 256,
        embedDescription: 4096,
        embedFooter: 2048,
        webhooks: 10,
        cooldownSeconds: 604800,
        eventsPerChannel: 100,
    },
    channelName: "Test",
    transcriptUrl: "https://example.test/live-transcript/test/",
};

/** A saved event, as the server returns it, for the editing tests. */
const existingEvent = () => ({
    id: 7,
    userId: 1,
    channelKey: mockconst.keyName,
    name: "Existing pings",
    enabled: true,
    webhooks: [{ name: "#mods", url: hook }],
    triggers: ["live", "upload"],
    content: "hey",
    embedEnabled: true,
    embed: { ...vocabulary.defaults.embed },
    cooldownSeconds: 300,
    sentCount: 3,
    lastSentAt: 1_700_000_000,
    lastError: "",
    lastErrorAt: 0,
    updatedAt: 1_700_000_000,
});

/**
 * Mock the account and notification endpoints for one test (passed to loadInDevmode as its setup step).
 * `state` is shared with the test: `preview` counts renders, `slowPreview` delays them, `expired` makes
 * the account routes answer 401, `log` is the delivery trail, `tests` the test sends.
 */
async function mockNotificationsApi(page, { events = [], state = {} } = {}) {
    state.preview = 0;
    state.tests = [];
    state.log = state.log || [];
    await page.route("**/livedetect", (route) => route.fulfill({ json: detectionStatus }));
    await page.route("**/auth/info", (route) =>
        route.fulfill({
            json: {
                registrationOpen: true,
                minPasswordLength: 8,
                maxPasswordLength: 128,
                minUsernameLength: 3,
                maxUsernameLength: 32,
            },
        }),
    );
    const session = {
        token: "test-token",
        expiresAt: 4_102_444_800,
        account: { username: "tester", createdAt: 1_700_000_000, sessions: 1 },
    };
    await page.route("**/auth/register", (route) => route.fulfill({ status: 201, json: session }));
    // Signing in again issues a fresh token, as the server does.
    await page.route("**/auth/login", (route) => {
        state.expired = false;
        return route.fulfill({ json: { ...session, token: "test-token-2" } });
    });
    await page.route("**/auth/logout", (route) => route.fulfill({ status: 204 }));
    // Two members of a shared account are signed in; revoking one drops it from the list.
    // The address fields stand in for an older server: the page must not show them.
    const sessions = [
        {
            id: 1,
            label: "Chrome on Windows",
            address: "203.0.113.9",
            createdAt: 1_700_000_000,
            lastSeenAt: 1_700_000_500,
            expiresAt: 4_102_444_800,
            current: true,
        },
        {
            id: 2,
            label: "Safari on iOS",
            address: "198.51.100.7",
            createdAt: 1_700_000_100,
            lastSeenAt: 1_700_000_400,
            expiresAt: 4_102_444_800,
            current: false,
        },
    ];
    await page.route("**/auth/sessions", (route) => route.fulfill({ json: { sessions } }));
    await page.route("**/auth/sessions/*", (route) => {
        const id = Number(route.request().url().split("/").pop());
        const i = sessions.findIndex((s) => s.id === id);
        if (i >= 0) sessions.splice(i, 1);
        return route.fulfill({ status: i >= 0 ? 204 : 404 });
    });
    const unauthorized = (route) => route.fulfill({ status: 401, json: { error: "Sign in to continue." } });
    const authed = (route) =>
        !state.expired && /^Bearer test-token/.test(route.request().headers().authorization || "");
    await page.route(`**/${mockconst.keyName}/notifications`, async (route) => {
        if (!authed(route)) return unauthorized(route);
        const req = route.request();
        if (req.method() === "POST") {
            const body = req.postDataJSON();
            const saved = {
                ...body,
                id: events.length + 1,
                userId: 1,
                channelKey: mockconst.keyName,
                sentCount: 0,
                lastSentAt: 0,
                lastError: "",
                lastErrorAt: 0,
            };
            events.push(saved);
            return route.fulfill({ status: 201, json: saved });
        }
        return route.fulfill({ json: { events, log: state.log, ...vocabulary } });
    });
    await page.route(`**/${mockconst.keyName}/notifications/*`, async (route) => {
        const req = route.request();
        const url = req.url();
        if (url.endsWith("/preview")) {
            if (!authed(route)) return unauthorized(route);
            state.preview += 1;
            if (state.slowPreview) await new Promise((r) => setTimeout(r, 2000));
            const draft = req.postDataJSON().event;
            state.lastPreviewBody = req.postDataJSON();
            return route.fulfill({
                json: {
                    trigger: "live",
                    content: draft.content || "",
                    embed: {
                        title: "Test's Stream Started",
                        // An offline Twitch stream renders the example title where {title} goes.
                        description: `**${state.exampleImage ? "Example stream title" : "A mocked stream"}**\n\n[Open on Twitch](https://twitch.tv/example)`,
                        url: "https://twitch.tv/example",
                        color: 0x2ecc71,
                        image: state.exampleImage
                            ? { url: "https://static-cdn.jtvnw.net/previews-ttv/live_user_x.jpg" }
                            : undefined,
                    },
                    sample: {
                        source: "recent",
                        platform: "twitch",
                        id: "31337",
                        url: "https://twitch.tv/example",
                        title: state.exampleImage ? "" : "A mocked stream",
                        exampleTitle: state.exampleImage ? "Example stream title" : undefined,
                        exampleImage: Boolean(state.exampleImage),
                        eventTime: 1_700_000_000,
                        ended: Boolean(state.exampleImage),
                    },
                },
            });
        }
        if (url.endsWith("/test")) {
            if (!authed(route)) return unauthorized(route);
            state.tests.push(req.postDataJSON());
            return route.fulfill({ json: { ok: true, webhook: "#mods (webhook 123456789012345678)" } });
        }
        const id = Number(url.split("/").pop());
        if (!authed(route)) return unauthorized(route);
        const i = events.findIndex((e) => e.id === id);
        if (req.method() === "PUT") {
            const body = req.postDataJSON();
            events[i] = { ...events[i], ...body, updatedAt: 1_700_000_999 };
            return route.fulfill({ json: events[i] });
        }
        if (req.method() === "DELETE") {
            if (i >= 0) events.splice(i, 1);
            return route.fulfill({ status: 204 });
        }
        return route.fulfill({ status: 404, json: { error: "not found" } });
    });
}

/** Register the test account from the events section and land back on the list, signed in. */
async function createAccount(page) {
    await page.getByTestId("events-sign-in").click();
    await page.getByTestId("account-username").fill("tester");
    await page.getByTestId("account-password").fill("swordfish tacos");
    await page.getByTestId("account-confirm").fill("swordfish tacos");
    await page.getByTestId("account-submit").click();
    await page.getByTestId("no-recovery-check").check();
    await page.getByTestId("no-recovery-ok").click();
    await expect(page.getByTestId("account-chip")).toContainText("tester");
}

/** On phones the editor shows one pane at a time; bring the preview or the form forward. */
async function showPane(page, pane) {
    const tab = page.getByTestId(`editor-tab-${pane}`);
    if (await tab.isVisible()) await tab.click();
}

test("shows detection status and recent detections without an account", async ({ page }) => {
    await loadInDevmode(page, `notifications/?channel=${mockconst.keyName}`, mockNotificationsApi);

    await expect(page.getByTestId("notifications-title")).toBeVisible();
    await expect(page.getByTestId("detection-state")).toHaveText("Healthy");
    await expect(page.getByTestId("events-signed-out")).toBeVisible();

    // Recent detections are open by default, with plain names for the mechanisms.
    await expect(page.getByTestId("detections-list")).toContainText("A mocked stream");
    await expect(page.getByTestId("detections-list")).toContainText("via Twitch push");
    await page.getByTestId("tab-deliveries").click();
    await expect(page).toHaveURL(/activity=deliveries/);
    await expect(page.getByText("Sign in to see what your events sent.")).toBeVisible();

    // The health details fold out on request.
    await page.getByTestId("detection-details").click();
    await expect(page.getByTestId("health-legs")).toContainText("Twitch push");
});

test("the sidebar links to the notifications page", async ({ page }) => {
    await loadInDevmode(page, `${mockconst.keyName}/`, mockNotificationsApi);
    await page.getByTestId("page-button-notifications").click();
    await expect(page).toHaveURL(new RegExp(`notifications/\\?channel=${mockconst.keyName}`));
    await expect(page.getByTestId("notifications-title")).toBeVisible();
});

test("creating an account and a notification event", async ({ page }) => {
    const events = [];
    await loadInDevmode(page, `notifications/?channel=${mockconst.keyName}`, (p) =>
        mockNotificationsApi(p, { events }),
    );

    // "Create a free account" opens the register tab; a generated password fills both fields.
    await page.getByTestId("events-sign-in").click();
    await expect(page.getByTestId("account-tab-register")).toHaveAttribute("aria-selected", "true");
    await page.getByTestId("account-username").fill("tester");
    await page.getByTestId("account-generate-password").click();
    await expect(page.getByTestId("account-generated-note")).toContainText("32-character password");
    const generated = await page.getByTestId("account-password").inputValue();
    expect(generated).toHaveLength(32);
    await expect(page.getByTestId("account-confirm")).toHaveValue(generated);
    await expect(page.getByTestId("account-password")).toHaveAttribute("type", "text");
    // Creating asks for the no-recovery confirmation first; nothing is sent until it is ticked.
    await page.getByTestId("account-submit").click();
    await expect(page.getByTestId("no-recovery-warning")).toContainText("no way to recover");
    await expect(page.getByTestId("no-recovery-ok")).toBeDisabled();
    await page.getByTestId("no-recovery-check").check();
    await page.getByTestId("no-recovery-ok").click();
    await expect(page.getByTestId("account-chip")).toContainText("tester");
    await expect(page.getByTestId("events-empty")).toContainText("No events yet");

    // The editor is its own page, named after the trigger until a name is typed.
    await page.getByTestId("events-new").click();
    await expect(page).toHaveURL(new RegExp(`notifications/events/new/\\?channel=${mockconst.keyName}`));
    await expect(page.getByTestId("editor-name")).toHaveValue("Live pings");
    await page.getByTestId("editor-trigger-upload").click();
    await expect(page.getByTestId("editor-name")).toHaveValue("Live + Upload pings");
    await page.getByTestId("editor-trigger-upload").click();

    // The preview is the server's rendering of the draft.
    await showPane(page, "preview");
    await expect(page.getByTestId("discord-preview")).toContainText("A mocked stream");
    await expect(page.getByTestId("editor-preview-note")).toContainText("most recent detection");
    await showPane(page, "edit");

    // Saving without a webhook is refused on the page, with the problem pinned to its field.
    await page.getByTestId("editor-name").fill("Stream pings");
    await page.getByTestId("editor-save").click();
    await expect(page.getByTestId("editor-error")).toContainText("Add at least one Discord webhook");
    await expect(page.getByTestId("editor-problems")).toContainText("1 to fix");

    await page.getByTestId("editor-webhook-name-0").fill("#announcements");
    await page.getByTestId("editor-webhook-url-0").fill(hook);
    await expect(page.getByTestId("editor-error")).toHaveCount(0);
    await page.getByTestId("editor-role-ping").click();
    await page.getByTestId("editor-role-id").fill("111222333444555666");
    await page.getByTestId("editor-insert-role").click();
    await expect(page.getByTestId("editor-content")).toHaveValue("<@&111222333444555666> ");
    await page.getByTestId("editor-save").click();

    // Saved: back on the list with the new row; the webhook token appears nowhere on the page.
    await expect(page).toHaveURL(new RegExp(`notifications/\\?channel=${mockconst.keyName}`));
    await expect(page.getByTestId("event-card-1")).toContainText("Stream pings");
    await expect(page.getByTestId("event-card-1")).toContainText("#announcements");
    expect(await page.content()).not.toContain(hookToken);
    expect(events).toHaveLength(1);
    expect(events[0].webhooks[0].url).toBe(hook);
    expect(events[0].webhooks[0].rowId).toBeUndefined();
    expect(events[0].content).toBe("<@&111222333444555666> ");
});

test("a draft survives the list refreshing, a reload and a session expiry", async ({ page }) => {
    const state = {};
    await loadInDevmode(page, `notifications/?channel=${mockconst.keyName}`, (p) => mockNotificationsApi(p, { state }));
    await createAccount(page);
    await page.getByTestId("events-new").click();
    await page.getByTestId("editor-name").fill("Kept draft");
    await page.getByTestId("editor-content").fill("hello there");
    await page.getByTestId("editor-webhook-url-0").fill(hook);

    // Leaving keeps the draft; the list refetches (as it does on a tab switch) and still offers it.
    await page.getByTestId("editor-back").click();
    await page.getByTestId("confirm-ok").click();
    await expect(page.getByTestId("events-draft-continue")).toBeVisible();
    await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
        document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(300);
    await page.getByTestId("events-draft-continue").click();
    await expect(page.getByTestId("editor-name")).toHaveValue("Kept draft");
    await expect(page.getByTestId("editor-content")).toHaveValue("hello there");
    await expect(page.getByTestId("editor-webhook-url-0")).toHaveValue(hook);

    // A reload restores it and says so.
    await page.reload();
    await expect(page.getByTestId("editor-draft-restored")).toBeVisible();
    await expect(page.getByTestId("editor-name")).toHaveValue("Kept draft");
    await expect(page.getByTestId("editor-content")).toHaveValue("hello there");

    // The session expires mid-edit: the preview says so, the draft stays, and signing
    // back in brings the preview back without touching the form.
    page.allowConsoleError("the server responded with a status of 401 (Unauthorized)");
    state.expired = true;
    await page.getByTestId("editor-content").fill("hello there again");
    await showPane(page, "preview");
    await expect(page.getByTestId("editor-preview-expired")).toBeVisible();
    await expect(page.getByTestId("editor-name")).toHaveValue("Kept draft");
    await page.getByTestId("editor-preview-expired").getByRole("button", { name: "sign in again" }).click();
    await page.getByTestId("account-username").fill("tester");
    await page.getByTestId("account-password").fill("swordfish tacos");
    await page.getByTestId("account-submit").click();
    await expect(page.getByTestId("editor-preview-expired")).toHaveCount(0);
    await expect(page.getByTestId("discord-preview")).toContainText("hello there again");
    await showPane(page, "edit");
    await expect(page.getByTestId("editor-content")).toHaveValue("hello there again");

    // Discarding goes back to the defaults.
    await page.getByTestId("editor-draft-discard").click();
    await expect(page.getByTestId("editor-name")).toHaveValue("Live pings");
    await expect(page.getByTestId("editor-content")).toHaveValue("");
});

test("typing never dims the preview and only message changes ask the server", async ({ page }) => {
    const state = {};
    await loadInDevmode(page, `notifications/?channel=${mockconst.keyName}`, (p) => mockNotificationsApi(p, { state }));
    await createAccount(page);
    await page.getByTestId("events-new").click();
    await showPane(page, "preview");
    await expect(page.getByTestId("discord-preview")).toContainText("A mocked stream");
    await showPane(page, "edit");
    await page.waitForTimeout(500);
    const before = state.preview;

    // The name and a webhook change nothing in the message: no render is requested,
    // and the webhook never travels with a preview.
    await page.getByTestId("editor-name").pressSequentially("Renamed pings", { delay: 10 });
    await page.getByTestId("editor-webhook-url-0").fill(hook);
    await page.waitForTimeout(700);
    expect(state.preview).toBe(before);
    expect(JSON.stringify(state.lastPreviewBody)).not.toContain(hookToken);

    // With a slow server, a burst of typing in the message is one request after the
    // pause; while it is pending the old rendering stays fully visible with a progress
    // line on top, never dimmed or blanked.
    state.slowPreview = true;
    await page.getByTestId("editor-content").fill("Hello everyone, we are live");
    await showPane(page, "preview");
    await expect(page.getByTestId("preview-updating")).toBeVisible();
    await expect(page.getByTestId("discord-preview")).toContainText("A mocked stream");
    const opacity = await page.evaluate(
        () => getComputedStyle(document.querySelector('[data-testid="discord-preview"]')).opacity,
    );
    expect(opacity).toBe("1");
    await expect(page.getByTestId("discord-preview")).toContainText("Hello everyone, we are live");
    await expect(page.getByTestId("preview-updating")).toHaveCount(0);
    expect(state.preview).toBe(before + 1);
});

test("editing, testing, pausing and deleting an existing event", async ({ page }) => {
    const events = [existingEvent()];
    const state = { exampleImage: true };
    await loadInDevmode(page, `notifications/?channel=${mockconst.keyName}`, (p) =>
        mockNotificationsApi(p, { events, state }),
    );
    await createAccount(page);
    const row = page.getByTestId("event-card-7");
    await expect(row).toContainText("Existing pings");
    await expect(row).toContainText("#mods");
    await expect(row).toContainText("sent 3×");
    expect(await page.content()).not.toContain(hookToken);

    // Open, change the name and the gap, and see the offline stream's examples labelled.
    await page.getByTestId("event-open-7").click();
    await expect(page).toHaveURL(new RegExp(`notifications/events/7/\\?channel=${mockconst.keyName}`));
    await expect(page.getByTestId("editor-name")).toHaveValue("Existing pings");
    await expect(page.getByTestId("editor-enabled")).toBeChecked();
    await expect(page.getByTestId("editor-webhook-url-0")).toHaveValue(hook);
    await showPane(page, "preview");
    await expect(page.getByTestId("preview-example-image")).toBeVisible();
    await expect(page.getByTestId("editor-preview-example")).toContainText("examples");
    await expect(page.getByTestId("discord-preview")).toContainText("Example stream title");

    // A test goes to a chosen webhook with the current draft; the dialog never shows the token.
    await page.getByTestId("editor-test").click();
    await expect(page.getByTestId("test-webhook-select")).toContainText("#mods");
    expect(await page.getByRole("dialog").innerText()).not.toContain(hookToken);
    await page.getByTestId("test-send").click();
    await expect(page.getByText("Test sent to #mods")).toBeVisible();
    expect(state.tests).toHaveLength(1);
    expect(state.tests[0].webhookUrl).toBe(hook);
    await showPane(page, "edit");

    await page.getByTestId("editor-name").fill("Renamed pings");
    await page.getByTestId("editor-save").click();
    await expect(page).toHaveURL(new RegExp(`notifications/\\?channel=${mockconst.keyName}`));
    await expect(row).toContainText("Renamed pings");
    expect(events[0].name).toBe("Renamed pings");

    // Pause from the row, then delete from its menu.
    await page.getByTestId("event-toggle-7").click();
    await expect(page.getByText("Paused “Renamed pings”")).toBeVisible();
    expect(events[0].enabled).toBe(false);
    await page.getByTestId("event-menu-7").click();
    await page.getByTestId("event-delete-7").click();
    await page.getByTestId("confirm-ok").click();
    await expect(page.getByTestId("event-card-7")).toHaveCount(0);
    expect(events).toHaveLength(0);
});

test("a shared account lists its sessions and can end one", async ({ page }) => {
    await loadInDevmode(page, `notifications/?channel=${mockconst.keyName}`, mockNotificationsApi);
    await createAccount(page);

    await page.getByTestId("account-chip").click();
    await page.getByTestId("account-sessions").click();
    const list = page.getByTestId("sessions-list");
    await expect(list).toContainText("Chrome on Windows");
    await expect(list).toContainText("This browser");
    await expect(list).toContainText("Safari on iOS");
    // Where a session signed in from is never shown, even if a server sent it.
    await expect(list).not.toContainText("198.51.100.7");
    await expect(list).not.toContainText("203.0.113.9");

    await page.getByTestId("session-revoke-2").click();
    await expect(list).not.toContainText("Safari on iOS");
    await expect(list).toContainText("Chrome on Windows");
    await expect(page.getByTestId("sessions-sign-out-others")).toBeDisabled();
});
