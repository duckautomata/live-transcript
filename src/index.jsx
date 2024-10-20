import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { SettingProvider } from "./providers/SettingProvider.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <SettingProvider>
            <App />
        </SettingProvider>
    </StrictMode>,
);
