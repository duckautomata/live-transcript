import { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { genericCensor, mintCensor } from "../logic/censors";
import { chapter_formatting, collection_formatting, HBD_formatting } from "../logic/formatting";

const TagFixer = ({ wsKey }) => {
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");
    const [numFixedLines, setNumFixedLines] = useState(0);
    const [copied, setCopied] = useState(false);

    const handleClear = () => {
        setLeftText("");
        setRightText("");
        setNumFixedLines(0);
    };

    const handleChange = (text) => {
        let numFixed = 0;
        const fixed = text
            ?.split("\n")
            ?.map((line) => {
                let newLine = genericCensor(line);
                if (wsKey === "mint") {
                    newLine = mintCensor(newLine);
                }
                if (newLine !== line) {
                    numFixed++;
                }
                return newLine;
            })
            ?.filter((line) => line.length > 0)
            ?.join("\n");

        let formatted = HBD_formatting(fixed);
        formatted = chapter_formatting(formatted);
        formatted = collection_formatting(formatted);

        setLeftText(text);
        setRightText(formatted);
        setNumFixedLines(numFixed);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(rightText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "97vh",
                padding: 2,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    overflow: "auto",
                    padding: 2,
                    flexGrow: 1,
                    mb: 2,
                }}
            >
                {/* Left Text Field */}
                <TextField
                    label="Input Tags"
                    variant="outlined"
                    fullWidth
                    multiline
                    value={leftText}
                    onChange={(e) => handleChange(e.target.value)}
                    sx={{ flex: 1, mr: 1 }}
                />

                {/* Right Text Field */}
                <TextField
                    label="Fixed Tags"
                    variant="outlined"
                    fullWidth
                    multiline
                    disabled
                    value={rightText}
                    sx={{ flex: 1, ml: 1 }}
                />
            </Box>

            {/* Buttons Section */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: "auto", // Ensures the buttons are pushed to the bottom
                }}
            >
                <Button variant="outlined" color="secondary" onClick={handleClear}>
                    Clear
                </Button>
                <Typography>Lines fixed: {numFixedLines}</Typography>
                <Button
                    id="copyButton"
                    variant="outlined"
                    color="primary"
                    disabled={rightText.length === 0}
                    onClick={handleCopy}
                >
                    {copied ? "Copied" : "Copy"}
                </Button>
            </Box>
        </Box>
    );
};

export default TagFixer;
