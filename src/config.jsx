import dokiIcon from "./assets/icons/doki.jpg";
import mintIcon from "./assets/icons/mint.jpg";
import { Avatar } from "@mui/material";
import { useAppStore } from "./store/store";

export const server = "http://192.168.10.15:8080";
export const wsServer = "ws://192.168.10.15:8080";
export const maxClipSize = 30;
export const keys = () => {
    const keys = ["doki", "mint"];
    if (useAppStore.getState().devMode) {
        keys.push("test");
    }

    return keys;
};
export const keyIcons = (size) => {
    if (size) {
        const icons = [
            {
                name: "Doki",
                icon: <Avatar src={dokiIcon} alt="doki" sx={{ width: size, height: size }} />,
                value: "doki",
            },
            {
                name: "Mint",
                icon: <Avatar src={mintIcon} alt="mint" sx={{ width: size, height: size }} />,
                value: "mint",
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
            });
        }
        return icons;
    }

    const icons = [
        { name: "Doki", icon: <Avatar src={dokiIcon} alt="doki" />, value: "doki" },
        { name: "Mint", icon: <Avatar src={mintIcon} alt="mint" />, value: "mint" },
    ];
    if (useAppStore.getState().devMode) {
        icons.push({ name: "Test", icon: <Avatar alt="test">T</Avatar>, value: "test" });
    }

    return icons;
};
