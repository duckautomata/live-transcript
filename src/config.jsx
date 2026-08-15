import dokiIcon from "./assets/icons/doki.jpg";
import mintIcon from "./assets/icons/mint.jpg";
import vicIcon from "./assets/icons/victoria.jpg";
import phoebeIcon from "./assets/icons/phoebe.jpg";
import beriIcon from "./assets/icons/beri.jpg";
import { Avatar } from "@mui/material";
import { Engineering } from "@mui/icons-material";

/** @type {string} */
export const server = import.meta.env.VITE_API_URL;
/** @type {string} */
export const wsServer = import.meta.env.VITE_WS_URL;
export const maxClipSize = 40;

export const keyIcons = (size, devMode = false) => {
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
        {
            name: "Victoria",
            icon: <Avatar src={vicIcon} alt="victoria" sx={{ width: size, height: size }} />,
            value: "victoria",
            testId: "key-icon-victoria",
        },
        {
            name: "Phoebe",
            icon: <Avatar src={phoebeIcon} alt="phoebe" sx={{ width: size, height: size }} />,
            value: "phoebe",
            testId: "key-icon-phoebe",
        },
        {
            name: "Beri",
            icon: <Avatar src={beriIcon} alt="beri" sx={{ width: size, height: size }} />,
            value: "beri",
            testId: "key-icon-beri",
        },
    ];

    if (devMode) {
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

export const keys = (devMode = false) => {
    const keys = keyIcons(120, devMode).map((streamer) => streamer.value);

    return keys;
};
