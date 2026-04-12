import config from "./playwright.mock.config.js";

const devConfig = {
    ...config,
    use: {
        ...config.use,
        baseURL: "http://localhost:5173/live-transcript/",
    },
    webServer: {
        ...config.webServer,
        command: "npm run dev",
        url: "http://localhost:5173/live-transcript/",
    },
};

export default devConfig;
