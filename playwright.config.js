import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 4,
    workers: process.env.CI ? 1 : undefined,
    timeout: 15 * 1000,
    reporter: "html",
    use: {
        baseURL: "http://localhost:4173/live-transcript/",
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
        {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 5"] },
        },
        {
            name: "Mobile Safari",
            use: { ...devices["iPhone 12"] },
        },
    ],

    webServer: {
        command: "npm run preview",
        url: "http://localhost:4173/live-transcript/",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
