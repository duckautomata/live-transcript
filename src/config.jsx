import dokiIcon from "./assets/icons/doki.jpg";
import mintIcon from "./assets/icons/mint.jpg";
import junaIcon from "./assets/icons/juna.jpg";
import { Avatar } from "@mui/material";

export const server = "https://dokiscripts.com";
export const wsServer = "wss://dokiscripts.com";
export const keys = () => {
    const keys = ["doki", "mint", "juna"];
    if (import.meta.env.DEV) {
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
            {
                name: "Juna",
                icon: <Avatar src={junaIcon} alt="juna" sx={{ width: size, height: size }} />,
                value: "juna",
            },
        ];
        if (import.meta.env.DEV) {
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
        { name: "Juna", icon: <Avatar src={junaIcon} alt="juna" />, value: "juna" },
    ];
    if (import.meta.env.DEV) {
        icons.push({ name: "Test", icon: <Avatar alt="test">T</Avatar>, value: "test" });
    }

    return icons;
};
