import { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { genericCensor, mintCensor } from "../logic/censors";
import { chapter_formatting, collection_formatting, HBD_formatting } from "../logic/formatting";
import { formatSummary, loadSummary, saveSummary } from "../logic/summary";
import { useAppStore } from "../store/store";
import { useEffect } from "react";

/**
 * Component for manually fixing and formatting transcript tags.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
const TagFixer = ({ wsKey }) => {
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");
    const [numFixedLines, setNumFixedLines] = useState(0);
    const [copied, setCopied] = useState(false);

    // Store access for timestamps if needed, or we just rely on summary data
    const startTime = useAppStore((state) => state.startTime);

    // Initial load from summary
    useEffect(() => {
        if (!wsKey) return;
        const summary = loadSummary(wsKey);
        const formatted = formatSummary(summary, startTime);
        if (formatted) {
            handleChange(formatted);
        }
    }, [wsKey, startTime]);

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

    const [chapters, setChapters] = useState([]);
    const [groups, setGroups] = useState({});

    useEffect(() => {
        if (!wsKey) return;
        const summary = loadSummary(wsKey);
        setChapters(summary.chapters || []);
        setGroups(summary.groups || {});
    }, [wsKey]);

    const handleChapterChange = (index, field, value) => {
        const newChapters = [...chapters];
        newChapters[index][field] = value;
        setChapters(newChapters);

        const summary = loadSummary(wsKey);
        summary.chapters = newChapters;
        saveSummary(wsKey, summary);
    };

    // Simple UI to list chapters/groups

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "97vh",
                padding: 2,
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Chapters</Typography>
                {chapters.map((chapter, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                            label="Title"
                            size="small"
                            value={chapter.title}
                            onChange={(e) => handleChapterChange(index, "title", e.target.value)}
                        />
                        <TextField
                            label="Start Text"
                            size="small"
                            fullWidth
                            value={chapter.text}
                            onChange={(e) => handleChapterChange(index, "text", e.target.value)}
                        />
                    </Box>
                ))}
            </Box>
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
