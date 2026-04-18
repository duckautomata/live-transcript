import dokiIcon from "./assets/icons/doki.jpg";
import mintIcon from "./assets/icons/mint.jpg";
import { Avatar } from "@mui/material";
import { useAppStore } from "./store/store";
import { Engineering } from "@mui/icons-material";

/** @type {string} */
export const server = import.meta.env.VITE_API_URL;
/** @type {string} */
export const wsServer = import.meta.env.VITE_WS_URL;
export const maxClipSize = 40;

export const keyIcons = (size) => {
    const icons = [
        {
            name: "Doki",
            icon: <Avatar src={dokiIcon} alt="doki" sx={{ width: size, height: size }} />,
            value: "doki",
            testId: "key-icon-doki",
        },
        {
            name: "Mint",
            icon: <Avatar src={mintIcon} alt="mint" sx={{ width: size, height: size }} />,
            value: "mint",
            testId: "key-icon-mint",
        },
    ];

    if (useAppStore.getState().devMode) {
        icons.push({
            name: "Test",
            icon: (
                <Avatar alt="test" sx={{ width: size, height: size }}>
                    T
                </Avatar>
            ),
            value: "test",
            testId: "key-icon-test",
        });
    }

    if (import.meta.env.VITE_ENVIRONMENT === "dev") {
        return [
            {
                name: "Dev",
                icon: (
                    <Avatar alt="dev" sx={{ width: size, height: size }}>
                        <Engineering sx={{ width: "70%", height: "70%" }} />
                    </Avatar>
                ),
                value: "dev",
                testId: "key-icon-dev",
            },
        ];
    } else {
        return icons;
    }
};

export const keys = () => {
    const keys = keyIcons(120).map((streamer) => streamer.value);

    return keys;
};
