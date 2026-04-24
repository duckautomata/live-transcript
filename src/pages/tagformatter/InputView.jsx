import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { ContentPaste, PlaylistAdd, Refresh, RestartAlt } from "@mui/icons-material";

const EXAMPLE_PLACEHOLDER = `Paste or type your raw tags here.`;

export const InputView = ({
    inputTags,
    setInputTags,
    formattedRows,
    onClear,
    onReturnToFormatted,
    onAppend,
    onFormat,
    onFormatFromClipboard,
}) => {
    const hasInput = inputTags.trim().length > 0;
    const hasFormatted = formattedRows.length > 0;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 64px)",
                p: 2,
                gap: 1.5,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Input Tags</Typography>
                </Box>
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

            <Paper variant="outlined" sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
                <TextField
                    multiline
                    fullWidth
                    variant="standard"
                    placeholder={EXAMPLE_PLACEHOLDER}
                    data-testid="tag-input-field"
                    value={inputTags}
                    onChange={(e) => setInputTags(e.target.value)}
                    slotProps={{ input: { disableUnderline: true } }}
                    sx={{
                        flexGrow: 1,
                        p: 1.5,
                        "& .MuiInputBase-root": {
                            height: "100%",
                            alignItems: "flex-start",
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                        },
                        "& textarea": {
                            height: "100% !important",
                            overflow: "auto !important",
                        },
                    }}
                />
            </Paper>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<RestartAlt />}
                    onClick={onClear}
                    data-testid="tag-reset-btn"
                >
                    Reset Data
                </Button>

                <Box sx={{ flexGrow: 1 }} />

                {hasFormatted && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={onReturnToFormatted}
                        data-testid="tag-return-formatted-btn"
                    >
                        Return to Formatted
                    </Button>
                )}

                {hasFormatted && hasInput && (
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<PlaylistAdd />}
                        onClick={onAppend}
                        data-testid="tag-append-btn"
                    >
                        Append Tags
                    </Button>
                )}

                {!hasFormatted && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContentPaste />}
                        onClick={onFormatFromClipboard}
                        data-testid="tag-format-clipboard-btn"
                    >
                        Format from Clipboard
                    </Button>
                )}

                {hasInput && (
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<Refresh />}
                        data-testid="tag-format-btn"
                        onClick={onFormat}
                    >
                        {hasFormatted ? "Re-Format Tags" : "Format Tags"}
                    </Button>
                )}
            </Box>
        </Box>
    );
};
