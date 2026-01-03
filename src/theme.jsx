import { createTheme } from "@mui/material/styles";
import { red, orange } from "@mui/material/colors";

// A custom theme for this app
export const darkTheme = createTheme({
    palette: {
        mode: "dark",
        id: {
            main: "#20A79A",
            loading: "#a8a8a8ff",
            clip: orange[900],
            background: "#FFFFFF",
        },
        timestamp: {
            main: "#8093E0",
        },
        lineground: {
            main: "#395553",
            clip: "#39254D",
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
            yellow: "#494913ff",
            teal: "#004d40",
            red: "#561b1b",
            orange: "#663c00",
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
            loading: "#474747ff",
            clip: orange[900],
            background: "#22B9AA",
        },
        timestamp: {
            main: "#304BC5",
        },
        lineground: {
            main: "#89A5A3",
            clip: "#C5B4E3",
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
            yellow: "#ffff00",
            teal: "#b2dfdb",
            red: "#ffcdd2",
            orange: "#ffe0b2",
        },
        error: {
            main: red.A400,
        },
    },
});
