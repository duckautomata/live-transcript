// oxlint-disable no-console
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * Content Security Policy for the built site. The point of it is script-src
 * 'self': the account session token lives in localStorage, so a script that
 * somehow got injected into the page is the realistic way to steal one - and
 * this stops any script that is not shipped with the site from running at
 * all. Styles allow inline because MUI/emotion inject them; images, media and
 * connections stay broad (R2 media, YouTube and Twitch thumbnails, the API
 * host) so nothing the pages show is blocked. Applied at build time only:
 * the dev server injects its own inline scripts for hot reloading.
 */
const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https: http://localhost:*",
    "connect-src 'self' https: wss: http://localhost:* ws://localhost:*",
    "worker-src 'self' blob:",
    "frame-src 'none'",
].join("; ");

// https://vitejs.dev/config/
export default defineConfig(() => {
    const buildTime = new Date().getTime();

    return {
        plugins: [
            react(),
            {
                name: "content-security-policy",
                apply: "build",
                transformIndexHtml() {
                    return [
                        {
                            tag: "meta",
                            attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
                            injectTo: "head-prepend",
                        },
                    ];
                },
            },
            {
                name: "generate-version-json",
                writeBundle(options) {
                    const outDir = options.dir || "live-transcript";
                    const versionFilePath = path.resolve(outDir, "version.json");
                    fs.writeFileSync(versionFilePath, JSON.stringify({ buildTime }));
                    console.log(`\nGenerated version.json with buildTime: ${buildTime}`);
                },
            },
        ],
        base: "/live-transcript/",
        define: {
            __BUILD_TIME__: buildTime,
        },
        server: {
            port: 5173,
            open: false,
        },
        build: {
            emptyOutDir: true,
            manifest: false,
            target: "esnext",
            outDir: "dist/live-transcript", // should be the same as base
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        if (id.includes("node_modules")) {
                            return "vendor";
                        }
                    },
                },
            },
        },
        test: {
            exclude: [...configDefaults.exclude, "tests/**"],
        },
    };
});
