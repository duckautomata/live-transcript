import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// A custom theme for this app
export const darkTheme = createTheme({
    palette: {
        mode: "dark",
        id: {
            main: "#20A79A",
            background: "#FFFFFF",
        },
        timestamp: {
            main: "#8093E0",
        },
        lineground: {
            main: "#7d5593",
        },
        primary: {
            main: "#20A79A",
            background: "#FFFFFF",
        },
        secondary: {
            main: "#FFFFFF",
            background: "#17786E",
        },
        background: {
            main: "#424242",
        },
        error: {
            main: red.A400,
        },
    },
});

export const lightTheme = createTheme({
    palette: {
        mode: "light",
        id: {
            main: "#12645B",
            background: "#22B9AA",
        },
        timestamp: {
            main: "#304BC5",
        },
        lineground: {
            main: "#b095be",
        },
        primary: {
            main: "#12645B",
            background: "#FFFFFF",
        },
        secondary: {
            main: "#000000",
            background: "#22B9AA",
        },
        background: {
            main: "#17786E",
        },
        error: {
            main: red.A400,
        },
    },
});
