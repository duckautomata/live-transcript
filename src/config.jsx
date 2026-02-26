import dokiIcon from "./assets/icons/doki.jpg";
import mintIcon from "./assets/icons/mint.jpg";
import { Avatar } from "@mui/material";
import { useAppStore } from "./store/store";

export const server = "https://api.duck-automata.com";
export const wsServer = "wss://api.duck-automata.com";
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
        icons.push(
            {
                name: "Test",
                icon: (
                    <Avatar alt="test" sx={{ width: size, height: size }}>
                        T
                    </Avatar>
                ),
                value: "test",
                testId: "key-icon-test",
            },
            {
                name: "Mock",
                icon: (
                    <Avatar alt="mock" sx={{ width: size, height: size, backgroundColor: "Highlight" }}>
                        M
                    </Avatar>
                ),
                value: "mock",
                testId: "key-icon-mock",
            },
        );
    }
    return icons;
};

export const keys = () => {
    const keys = keyIcons(120).map((streamer) => streamer.value);

    return keys;
};
