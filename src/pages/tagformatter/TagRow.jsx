import { useState, useEffect, memo } from "react";
import { Box, TextField, Typography, Checkbox, IconButton, Tooltip } from "@mui/material";
import { orange, purple } from "@mui/material/colors";
import { Check, Edit } from "@mui/icons-material";

export const TagRow = memo(
    ({
        row,
        isEditing,
        startEditing,
        saveEdit,
        cancelEdit,
        toggleRowEnabled,
        extraMarginTop,
        densityStyles,
        theme,
        highlightColor,
        isHighlightedRow,
        headerOpacity,
        headerDecoration,
        registerRef,
        onMouseEnter,
        onMouseLeave,
        isHighlightedParent,
    }) => {
        const [localValue, setLocalValue] = useState("");
        const [localTimestamp, setLocalTimestamp] = useState("");

        useEffect(() => {
            if (isEditing) {
                setLocalValue(row.type === "header" ? row.name : row.text);
                setLocalTimestamp(row.timestamp || "");
            }
        }, [isEditing, row]);

        const handleSave = () => {
            saveEdit(row.id, localValue, localTimestamp);
        };

        const handleKeyDown = (e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") cancelEdit();
        };

        if (row.type === "header") {
            const isChapter = row.subtype === "chapter";
            return (
                <Box
                    key={row.id}
                    ref={(el) => registerRef(row.id, el)}
                    data-testid={`tag-header-${row.name}`}
                    data-row-subtype={row.subtype}
                    data-row-enabled={row.isEnabled ? "true" : "false"}
                    data-row-original-name={row.originalName || ""}
                    data-row-timestamp={row.timestamp || ""}
                    data-row-decoration={headerDecoration}
                    data-row-highlighted={isHighlightedRow ? "true" : "false"}
                    data-row-highlighted-parent={isHighlightedParent ? "true" : "false"}
                    sx={{
                        py: 1,
                        paddingBottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: isChapter ? orange[500] : theme.palette.primary.main,
                        borderBottom: isEditing ? `1px solid ${purple[500]}` : "none",
                        opacity: headerOpacity,
                        textDecoration: headerDecoration,
                        bgcolor: isHighlightedRow
                            ? "action.selected"
                            : isHighlightedParent
                              ? "action.hover"
                              : "transparent",
                        transition: "background-color 0.3s ease",
                    }}
                >
                    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {isEditing ? (
                            <>
                                {isChapter && (
                                    <TextField
                                        variant="standard"
                                        value={localTimestamp}
                                        onChange={(e) => setLocalTimestamp(e.target.value)}
                                        placeholder="00:00"
                                        sx={{ width: "60px", mr: 1 }}
                                        slotProps={{
                                            htmlInput: {
                                                style: { textAlign: "right", fontWeight: "bold", color: "inherit" },
                                            },
                                        }}
                                        onKeyDown={handleKeyDown}
                                    />
                                )}
                                <TextField
                                    variant="standard"
                                    value={localValue}
                                    onChange={(e) => setLocalValue(e.target.value)}
                                    autoFocus
                                    fullWidth
                                    onKeyDown={handleKeyDown}
                                    slotProps={{
                                        htmlInput: {
                                            style: { textAlign: "center", fontWeight: "bold", color: "inherit" },
                                        },
                                    }}
                                />
                            </>
                        ) : (
                            <Tooltip title={row.originalName}>
                                <Typography sx={{ fontWeight: "bold", textDecoration: headerDecoration }}>
                                    {isChapter && row.timestamp && (
                                        <span style={{ marginRight: "8px", opacity: 0.8 }}>{row.timestamp}</span>
                                    )}
                                    *{row.name}*
                                </Typography>
                            </Tooltip>
                        )}
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => (isEditing ? handleSave() : startEditing(row))}
                        sx={{ color: isEditing ? "success.main" : purple[500], ml: 1 }}
                    >
                        {isEditing ? <Check fontSize="small" /> : <Edit fontSize="small" />}
                    </IconButton>
                </Box>
            );
        }

        // Tag Row
        const opacity = !row.isEnabled ? 0.5 : 1;
        const textDecoration = !row.isEnabled ? "line-through" : "none";

        return (
            <Box
                key={row.id}
                data-testid="tag-row"
                data-row-timestamp={row.timestamp}
                data-row-subtype={row.subtype}
                data-row-enabled={row.isEnabled ? "true" : "false"}
                data-row-parent-name={row.parentName || ""}
                data-row-original-text={row.originalText || ""}
                data-row-highlighted={highlightColor ? "true" : "false"}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    margin: "0 0 0 0",
                    marginTop: extraMarginTop,
                    padding: "0 0 0 0",
                    ...densityStyles,
                    opacity: isEditing ? 1 : opacity,
                    bgcolor: isEditing ? "action.selected" : highlightColor ? highlightColor : "transparent",
                    border: isEditing ? `0px solid ${purple[500]}` : "0px solid transparent",
                    "&:hover": { bgcolor: isEditing ? "action.selected" : "action.hover" },
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <Checkbox
                    checked={row.isEnabled}
                    onChange={() => toggleRowEnabled(row.id)}
                    size="small"
                    sx={{ color: "primary.main", p: 0.5 }}
                />
                {isEditing ? (
                    <TextField
                        variant="standard"
                        value={localTimestamp}
                        onChange={(e) => setLocalTimestamp(e.target.value)}
                        sx={{ minWidth: "50px", width: "60px", mx: 1 }}
                        slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: "monospace",
                            mx: 1,
                            minWidth: "50px",
                            color: theme.palette.timestamp.main,
                            textDecoration,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        {row.timestamp}
                    </Typography>
                )}

                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        variant="standard"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSave();
                            }
                            if (e.key === "Escape") cancelEdit();
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                ) : (
                    <Tooltip title={highlightColor ? row.originalText : undefined}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "monospace",
                                flexGrow: 1,
                                textDecoration,
                                textAlign: "left",
                                wordBreak: "break-word",
                                minWidth: 0,
                            }}
                        >
                            {row.text}
                        </Typography>
                    </Tooltip>
                )}

                <IconButton
                    size="small"
                    onClick={() => (isEditing ? handleSave() : startEditing(row))}
                    sx={{ color: isEditing ? "success.main" : purple[500] }}
                >
                    {isEditing ? <Check fontSize="small" /> : <Edit fontSize="small" />}
                </IconButton>
            </Box>
        );
    },
);

TagRow.displayName = "TagRow";
