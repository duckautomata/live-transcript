import { Box, Paper, Typography, TextField, Button, Switch, Tooltip } from "@mui/material";

export const BulkEditPanel = ({
    bulkEdit,
    handleBulkEditChange,
    applyOffset,
    applyEnableDisable,
    applyFindReplace,
    highlightStats,
    theme,
}) => (
    <Paper elevation={3} sx={{ height: "100%", p: 2, overflowY: "auto" }}>
        <Typography variant="h6">Bulk Edit</Typography>

        {/* Offset Timestamps */}
        <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                Offset Timestamps
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                    label="Start"
                    size="small"
                    placeholder="00:00"
                    data-testid="tag-offset-start"
                    value={bulkEdit.offsetStart}
                    onChange={(e) => handleBulkEditChange("offsetStart", e.target.value)}
                />
                <TextField
                    label="End"
                    size="small"
                    placeholder="01:00"
                    data-testid="tag-offset-end"
                    value={bulkEdit.offsetEnd}
                    onChange={(e) => handleBulkEditChange("offsetEnd", e.target.value)}
                />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    label="Offset"
                    size="small"
                    placeholder="00:05"
                    data-testid="tag-offset-amount"
                    value={bulkEdit.offsetAmount}
                    onChange={(e) => handleBulkEditChange("offsetAmount", e.target.value)}
                    sx={{ flexGrow: 1 }}
                />
                <Tooltip title="Add offset to timestamp">
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => applyOffset(1)}
                        data-testid="tag-offset-add"
                    >
                        +
                    </Button>
                </Tooltip>
                <Tooltip title="Subtract offset from timestamp">
                    <Button
                        variant="contained"
                        size="small"
                        color="warning"
                        onClick={() => applyOffset(-1)}
                        data-testid="tag-offset-subtract"
                    >
                        -
                    </Button>
                </Tooltip>
            </Box>
        </Box>

        {/* Enable/Disable */}
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                Enable/Disable Range
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                    label="Start"
                    size="small"
                    placeholder="00:00"
                    data-testid="tag-enable-start"
                    value={bulkEdit.enableStart}
                    onChange={(e) => handleBulkEditChange("enableStart", e.target.value)}
                />
                <TextField
                    label="End"
                    size="small"
                    placeholder="01:00"
                    data-testid="tag-enable-end"
                    value={bulkEdit.enableEnd}
                    onChange={(e) => handleBulkEditChange("enableEnd", e.target.value)}
                />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => applyEnableDisable(true)}
                    data-testid="tag-enable-btn"
                >
                    Enable
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    color="error"
                    onClick={() => applyEnableDisable(false)}
                    data-testid="tag-disable-btn"
                >
                    Disable
                </Button>
            </Box>
        </Box>

        {/* Find & Replace */}
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                Find & Replace
            </Typography>
            <TextField
                label="Find"
                size="small"
                fullWidth
                sx={{ mb: 1 }}
                data-testid="tag-find-text"
                value={bulkEdit.findText}
                onChange={(e) => handleBulkEditChange("findText", e.target.value)}
            />
            <TextField
                label="Replace"
                size="small"
                fullWidth
                sx={{ mb: 1 }}
                data-testid="tag-replace-text"
                value={bulkEdit.replaceText}
                onChange={(e) => handleBulkEditChange("replaceText", e.target.value)}
            />
            <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={applyFindReplace}
                data-testid="tag-replace-all-btn"
            >
                Replace All
            </Button>
        </Box>

        {/* Highlight */}
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                Highlight timestamps that:
            </Typography>

            {/* Time Delta */}
            <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Switch
                        checked={bulkEdit.isHighlightTime}
                        onChange={(e) => handleBulkEditChange("isHighlightTime", e.target.checked)}
                        size="small"
                        sx={{ mr: 1 }}
                        data-testid="tag-highlight-time"
                    />
                    <Typography variant="body2" sx={{ mr: 0.5, whiteSpace: "nowrap" }}>
                        are under
                    </Typography>
                    <TextField
                        size="small"
                        variant="standard"
                        value={bulkEdit.highlightThreshold}
                        onChange={(e) => handleBulkEditChange("highlightThreshold", e.target.value)}
                        disabled={!bulkEdit.isHighlightTime}
                        sx={{ width: "40px", mr: 0.5, "& input": { textAlign: "center" } }}
                        data-testid="tag-highlight-time-threshold"
                    />
                    <Typography variant="body2" sx={{ mr: 0.5, whiteSpace: "nowrap" }}>
                        seconds apart
                    </Typography>
                </Box>
                {bulkEdit.isHighlightTime && (
                    <Box sx={{ pl: 5, mt: 0.5 }}>
                        <Box
                            data-testid="tag-highlight-time-count"
                            sx={{
                                display: "inline-block",
                                bgcolor: theme.palette.background.yellow,
                                color: theme.palette.getContrastText(theme.palette.background.yellow),
                                px: 1,
                                borderRadius: 1,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                            }}
                        >
                            {highlightStats.countTime} found
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Censored/Filtered */}
            <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                <Switch
                    checked={bulkEdit.isHighlightCensored}
                    onChange={(e) => handleBulkEditChange("isHighlightCensored", e.target.checked)}
                    size="small"
                    sx={{ mr: 1 }}
                    data-testid="tag-highlight-censored"
                />
                <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                    are censored/filtered
                </Typography>
                {bulkEdit.isHighlightCensored && (
                    <Box
                        data-testid="tag-highlight-censored-count"
                        sx={{
                            display: "inline-block",
                            bgcolor: theme.palette.background.orange,
                            color: theme.palette.getContrastText(theme.palette.background.orange),
                            px: 1,
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                        }}
                    >
                        {highlightStats.countCensored} found
                    </Box>
                )}
            </Box>

            {/* Contains * */}
            <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                <Switch
                    checked={bulkEdit.isHighlightStar}
                    onChange={(e) => handleBulkEditChange("isHighlightStar", e.target.checked)}
                    size="small"
                    sx={{ mr: 1 }}
                    data-testid="tag-highlight-star"
                />
                <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                    contain a *
                </Typography>
                {bulkEdit.isHighlightStar && (
                    <Box sx={{ pl: 5, mt: 0.5 }}>
                        <Box
                            data-testid="tag-highlight-star-count"
                            sx={{
                                display: "inline-block",
                                bgcolor: theme.palette.background.red,
                                color: theme.palette.getContrastText(theme.palette.background.red),
                                px: 1,
                                borderRadius: 1,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                            }}
                        >
                            {highlightStats.countStar} found
                        </Box>
                    </Box>
                )}
            </Box>

            {/* All Caps */}
            <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                <Switch
                    checked={bulkEdit.isHighlightCaps}
                    onChange={(e) => handleBulkEditChange("isHighlightCaps", e.target.checked)}
                    size="small"
                    sx={{ mr: 1 }}
                    data-testid="tag-highlight-caps"
                />
                <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                    are all caps
                </Typography>
                {bulkEdit.isHighlightCaps && (
                    <Box sx={{ pl: 5, mt: 0.5 }}>
                        <Box
                            data-testid="tag-highlight-caps-count"
                            sx={{
                                display: "inline-block",
                                bgcolor: theme.palette.background.teal,
                                color: theme.palette.getContrastText(theme.palette.background.teal),
                                px: 1,
                                borderRadius: 1,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                            }}
                        >
                            {highlightStats.countCaps} found
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    </Paper>
);
