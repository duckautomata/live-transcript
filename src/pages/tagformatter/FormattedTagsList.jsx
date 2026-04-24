import { Box, Button, Paper, Typography } from "@mui/material";
import { Check, ContentCopy } from "@mui/icons-material";
import { TagRow } from "./TagRow";

export const FormattedTagsList = ({
    displayedRows,
    formattedRows,
    controls,
    editingId,
    startEditing,
    saveEdit,
    cancelEdit,
    toggleRowEnabled,
    densityStyles,
    theme,
    highlightStats,
    highlightedRowId,
    registerRef,
    handleRowHover,
    hoveredParent,
    onBackToInput,
    isCopied,
    onCopy,
}) => (
    <Paper
        elevation={3}
        sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.default",
        }}
    >
        <Box
            sx={{
                p: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderBottom: 1,
                borderColor: "divider",
            }}
        >
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Formatted Tags
            </Typography>

            <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={onBackToInput}
                data-testid="tag-back-input-btn"
            >
                Back to Input
            </Button>

            <Button
                variant="contained"
                color={isCopied ? "success" : "primary"}
                startIcon={isCopied ? <Check /> : <ContentCopy />}
                onClick={onCopy}
                size="small"
                data-testid="tag-copy-btn"
            >
                {isCopied ? "Copied!" : "Copy to Clipboard"}
            </Button>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
            {displayedRows.map((row, index) => {
                const parentControl = row.parentName ? controls[row.parentName] : null;
                const isParentDisabled = parentControl && !parentControl.isEnabled;

                let extraMarginTop = 0;
                if (index > 0) {
                    const prevRow = displayedRows[index - 1];
                    const isPrevCollection =
                        prevRow.subtype === "collection" &&
                        (prevRow.type === "header"
                            ? controls[prevRow.name]?.isEnabled
                            : controls[prevRow.parentName]?.isEnabled);
                    const isCurrCollection =
                        row.subtype === "collection" &&
                        (row.type === "header" ? controls[row.name]?.isEnabled : controls[row.parentName]?.isEnabled);

                    if (isPrevCollection && !isCurrCollection && row.type !== "header") {
                        extraMarginTop = 2;
                    }
                }

                if (row.type === "header" && isParentDisabled) return null;

                let hasEnabledChildren = false;
                if (row.type === "header") {
                    hasEnabledChildren = formattedRows.some((r) => r.parentName === row.name && r.isEnabled);
                }
                const headerOpacity = row.isEnabled && hasEnabledChildren ? 1 : 0.5;
                const headerDecoration = row.isEnabled && hasEnabledChildren ? "none" : "line-through";

                return (
                    <TagRow
                        key={row.id}
                        row={row}
                        isEditing={editingId === row.id}
                        startEditing={startEditing}
                        saveEdit={saveEdit}
                        cancelEdit={cancelEdit}
                        toggleRowEnabled={toggleRowEnabled}
                        extraMarginTop={extraMarginTop}
                        densityStyles={densityStyles}
                        theme={theme}
                        highlightColor={highlightStats.rowColors[row.id]}
                        isHighlightedRow={highlightedRowId === row.id}
                        headerOpacity={headerOpacity}
                        headerDecoration={headerDecoration}
                        registerRef={registerRef}
                        onMouseEnter={() => row.parentName && handleRowHover(row.parentName)}
                        onMouseLeave={() => handleRowHover(null)}
                        isHighlightedParent={row.type === "header" && row.name === hoveredParent}
                    />
                );
            })}
        </Box>
    </Paper>
);
