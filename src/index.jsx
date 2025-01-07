import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { SettingProvider } from "./providers/SettingProvider.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter basename="live-transcript">
            <SettingProvider>
                <App />
            </SettingProvider>
        </BrowserRouter>
    </StrictMode>,
);
