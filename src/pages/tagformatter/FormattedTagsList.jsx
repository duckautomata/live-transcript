import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Check, ContentCopy, Inbox } from "@mui/icons-material";
import { TagRow } from "./TagRow";

const computeStats = (displayedRows, controls) => {
    let totalTags = 0;
    let enabledTags = 0;
    let birthdayTags = 0;
    displayedRows.forEach((r) => {
        if (r.type !== "tag") return;
        totalTags++;
        if (r.isEnabled) enabledTags++;
        if (r.subtype === "hbd") birthdayTags++;
    });

    let collectionCount = 0;
    let chapterCount = 0;
    Object.values(controls).forEach((c) => {
        if (c.type === "collection") collectionCount++;
        else if (c.type === "chapter") chapterCount++;
    });

    return { totalTags, enabledTags, birthdayTags, collectionCount, chapterCount };
};

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
    isMobile = false,
}) => {
    const stats = computeStats(displayedRows, controls);

    return (
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
                    px: 2,
                    py: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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

                {!isMobile && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`${stats.enabledTags} / ${stats.totalTags} tags`}
                        />
                        {stats.collectionCount > 0 && (
                            <Chip size="small" variant="outlined" label={`${stats.collectionCount} collections`} />
                        )}
                        {stats.chapterCount > 0 && (
                            <Chip size="small" variant="outlined" label={`${stats.chapterCount} chapters`} />
                        )}
                        {stats.birthdayTags > 0 && (
                            <Chip size="small" variant="outlined" label={`${stats.birthdayTags} birthdays`} />
                        )}
                    </Stack>
                )}
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
                {displayedRows.length === 0 ? (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "text.secondary",
                            gap: 1,
                        }}
                    >
                        <Inbox sx={{ fontSize: 48, opacity: 0.4 }} />
                        <Typography variant="body2">No formatted tags yet</Typography>
                        <Button variant="text" size="small" onClick={onBackToInput}>
                            Go to Input
                        </Button>
                    </Box>
                ) : (
                    displayedRows.map((row, index) => {
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
                                (row.type === "header"
                                    ? controls[row.name]?.isEnabled
                                    : controls[row.parentName]?.isEnabled);

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
                    })
                )}
            </Box>
        </Paper>
    );
};
