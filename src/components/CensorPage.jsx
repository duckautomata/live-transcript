import { useState } from "react";
import { Box, TextField, Typography, Paper, Button } from "@mui/material";
import { genericCensor } from "../logic/censors";

export default function CensorPage() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");

    const handleChange = (e) => {
        const text = e.target.value;
        setInput(text);
        setOutput(genericCensor(text));
    };

    const handleClear = () => {
        setInput("");
        setOutput("");
    };

    const handleCopy = () => {
        if (output) {
            navigator.clipboard.writeText(output);
        }
    };

    return (
        <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3, maxWidth: 800, mx: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Censor Test
            </Typography>

            <TextField
                label="Input Text"
                multiline
                rows={4}
                variant="outlined"
                fullWidth
                value={input}
                onChange={handleChange}
                placeholder="Type something here to see it censored..."
            />

            <Box>
                <Typography variant="h6" gutterBottom>
                    Output:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 100, bgcolor: "background.default" }}>
                    <Typography style={{ whiteSpace: "pre-wrap" }}>
                        {output || "Censored output will appear here..."}
                    </Typography>
                </Paper>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="outlined" color="error" onClick={handleClear}>
                    Clear
                </Button>
                <Button variant="contained" onClick={handleCopy} disabled={!output}>
                    Copy Output
                </Button>
            </Box>
        </Box>
    );
}
