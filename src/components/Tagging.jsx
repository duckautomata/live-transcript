import { useState } from "react";
import { TextField, Grid, Box } from "@mui/material";
import { genericCensor, mintCensor } from "../logic/censors";
import Transcript from "./Transcript";

const Tagging = ({ wsKey, searchTerm, setSearchTerm }) => {
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");
    const [numFixedLines, setNumFixedLines] = useState(0);

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
            ?.join("\n");
        setLeftText(text);
        setRightText(fixed);
        setNumFixedLines(numFixed);
    };

    const handleCopy = () => {
        const copyText = rightText
            .split("\n")
            .filter((line) => line.length > 0)
            .join("\n");
        navigator.clipboard.writeText(copyText); // Copy left text to clipboard
    };

    return (
        <Grid
            container
            spacing={2}
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "flex-start", width: "100%", height: "100%" }}
        >
            <Grid size={4}>
                <TextField
                    label="Input Tags"
                    variant="outlined"
                    fullWidth
                    multiline
                    value={leftText}
                    onChange={(e) => handleChange(e.target.value)}
                    sx={{ flex: 1, mr: 1 }}
                />
            </Grid>
            <Grid size={8} sx={{ height: "100%" }}>
                <Transcript wsKey={wsKey} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </Grid>
        </Grid>
    );
};

export default Tagging;
