import { Box, TextField, Button } from "@mui/material";

export const InputView = ({
    inputTags,
    setInputTags,
    formattedRows,
    onClear,
    onReturnToFormatted,
    onAppend,
    onFormat,
    onFormatFromClipboard,
}) => (
    <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 64px)",
            p: 2,
        }}
    >
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button
                variant="text"
                color="secondary"
                size="small"
                disabled={!inputTags}
                onClick={() => setInputTags("")}
                data-testid="tag-clear-input-btn"
            >
                Clear Input
            </Button>
        </Box>
        <TextField
            label="Input Tags"
            multiline
            fullWidth
            variant="outlined"
            data-testid="tag-input-field"
            value={inputTags}
            onChange={(e) => setInputTags(e.target.value)}
            sx={{
                flexGrow: 1,
                mb: 2,
                "& .MuiInputBase-root": {
                    height: "100%",
                    alignItems: "flex-start",
                },
                "& textarea": {
                    height: "100% !important",
                    overflow: "auto !important",
                },
            }}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={onClear} data-testid="tag-reset-btn">
                Reset Data
            </Button>
            {formattedRows.length > 0 && (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={onReturnToFormatted}
                    data-testid="tag-return-formatted-btn"
                >
                    Return to Formatted
                </Button>
            )}
            {formattedRows.length > 0 && inputTags.trim().length > 0 && (
                <Button variant="contained" color="success" onClick={onAppend} data-testid="tag-append-btn">
                    Append Tags
                </Button>
            )}

            {inputTags.trim().length > 0 && (
                <Button variant="contained" color="primary" data-testid="tag-format-btn" onClick={onFormat}>
                    {formattedRows.length > 0 ? "Re-Format Tags" : "Format Tags"}
                </Button>
            )}

            {formattedRows.length === 0 && (
                <Button variant="outlined" onClick={onFormatFromClipboard} data-testid="tag-format-clipboard-btn">
                    Format from Clipboard
                </Button>
            )}
        </Box>
    </Box>
);
