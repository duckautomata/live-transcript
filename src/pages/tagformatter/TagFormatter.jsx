/* eslint-disable react-hooks/set-state-in-effect */
/**
 *
 * WARNING: This file is 1.6k lines of who knows what. Good luck trying to decipher it.
 *
 */
import { useState, useEffect, useMemo, useRef, memo, useCallback } from "react";
import {
    Box,
    TextField,
    Button,
    useMediaQuery,
    useTheme,
    Typography,
    Paper,
    Checkbox,
    IconButton,
    Tooltip,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { timeToSeconds, secondsToTime, recalculateStructure, parseRawInput, mergeTags } from "../../logic/tagHelpers";
import { orange, purple } from "@mui/material/colors";
import { Check, ContentCopy, Edit, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { useAppStore } from "../../store/store";
import { LOG_ERROR } from "../../logic/debug";

const TagRow = memo(
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
                                        inputProps={{
                                            style: { textAlign: "right", fontWeight: "bold", color: "inherit" },
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
                                    inputProps={{
                                        style: { textAlign: "center", fontWeight: "bold", color: "inherit" },
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
                sx={{
                    display: "flex",
                    alignItems: "center",
                    margin: "0 0 0 0",
                    marginTop: extraMarginTop, // Apply separating margin
                    padding: "0 0 0 0",
                    ...densityStyles, // Apply density styles
                    opacity: isEditing ? 1 : opacity,
                    bgcolor: isEditing
                        ? "action.selected"
                        : highlightColor // Use specific highlight color
                          ? highlightColor
                          : "transparent",
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
                        inputProps={{ style: { fontFamily: "monospace" } }}
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
                            whiteSpace: "nowrap", // Prevent timestamp wrapping
                            flexShrink: 0, // Prevent timestamp shrinking
                        }}
                    >
                        {row.timestamp}
                    </Typography>
                )}

                {/* Content */}
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
                                wordBreak: "break-word", // Wrap long text
                                minWidth: 0, // Allow shrinking to container
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

/**
 * Component for manually fixing and formatting transcript tags.
 * Redesigned with 4-part layout: Input, Formatted, Controls, Group Edit.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
const TagFormatter = ({ wsKey }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const birthdayText = wsKey === "doki" ? "Dragoon Birthdays" : "Birthdays!";

    // --- State ---
    const [view, setView] = useState("input"); // 'input' | 'formatted'
    const [loadedKey, setLoadedKey] = useState(null);

    // Store State
    const inputTags = useAppStore((state) => state.inputTags);
    const setInputTags = useAppStore((state) => state.setInputTags);
    const formattedRows = useAppStore((state) => state.formattedRows);
    const setFormattedRows = useAppStore((state) => state.setFormattedRows);
    const controls = useAppStore((state) => state.controls);
    const setControls = useAppStore((state) => state.setControls);

    const [editingId, setEditingId] = useState(null);

    // --- Effects ---

    // Load View state
    useEffect(() => {
        const savedView = localStorage.getItem(`tagFormatter_view_${wsKey}`);
        if (savedView) setView(savedView);
        setLoadedKey(wsKey);
    }, [wsKey]);

    // Persist View state
    useEffect(() => {
        if (loadedKey !== wsKey) return;
        localStorage.setItem(`tagFormatter_view_${wsKey}`, view);
    }, [view, wsKey, loadedKey]);

    // --- Logic ---

    // --- Logic ---

    const handleClear = () => {
        setDialogConfig({
            open: true,
            title: "Clear Data",
            message: "Are you sure you want to clear all tags? This action cannot be undone.",
            confirmLabel: "Clear",
            onConfirm: () => {
                setInputTags("");
                setFormattedRows([]);
                setControls({});
                setView("input");
            },
        });
    };

    const handleFormatFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                setDialogConfig({
                    open: true,
                    title: "Empty Clipboard",
                    message: "Clipboard is empty or contains only whitespace.",
                    confirmLabel: "OK",
                    onConfirm: null,
                });
                return;
            }
            setInputTags(text);
            handleFormat(text);
        } catch (err) {
            LOG_ERROR("Failed to read clipboard:", err);
            setDialogConfig({
                open: true,
                title: "Error",
                message: "Failed to read from clipboard. Please paste manually.",
                confirmLabel: "OK",
                onConfirm: null,
            });
        }
    };

    const handleFormat = (textToFormat = inputTags) => {
        if (!textToFormat.trim()) return;

        const { newRows, newControls } = parseRawInput(textToFormat, wsKey, birthdayText);

        setFormattedRows(newRows);
        setControls(newControls);
        setView("formatted");
    };

    const handleAppend = () => {
        if (!inputTags.trim()) return;

        const { newRows, newControls } = parseRawInput(inputTags, wsKey, birthdayText);
        const { rows, controls: updatedControls } = mergeTags(
            formattedRows,
            controls,
            newRows,
            newControls,
            birthdayText,
        );

        setFormattedRows(rows);
        setControls(updatedControls);
        setView("formatted");
    };

    // --- Actions ---

    const toggleRowEnabled = useCallback(
        (id) => {
            const row = formattedRows.find((r) => r.id === id);
            if (!row) return;

            const newState = !row.isEnabled;

            if (row.type === "header") {
                // Sync Control
                setControls((prevControls) => {
                    const control = prevControls[row.name];
                    if (control) {
                        return { ...prevControls, [row.name]: { ...control, isEnabled: newState } };
                    }
                    return prevControls;
                });

                // Update Row
                setFormattedRows((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: newState } : r)));
            } else {
                // Normal Row Toggle
                setFormattedRows((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: newState } : r)));
            }
        },
        [formattedRows, setControls, setFormattedRows],
    );

    const startEditing = useCallback((row) => {
        setEditingId(row.id);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingId(null);
    }, []);

    const saveEdit = useCallback(
        (id, newValue, newTimestamp) => {
            const row = formattedRows.find((r) => r.id === id);
            if (!row) return;

            // Clean newlines from input
            const sanitizedValue = newValue.replace(/[\r\n]+/g, " ");

            if (row.type === "header") {
                const oldName = row.name;
                const newName = sanitizedValue.trim();

                if (oldName === newName && (!newTimestamp || newTimestamp === row.timestamp)) {
                    cancelEdit();
                    return;
                }

                if (!newName) {
                    setDialogConfig({
                        open: true,
                        title: "Error",
                        message: "Name cannot be empty",
                        confirmLabel: "OK",
                        onConfirm: null,
                    });
                    return;
                }

                if (newName !== oldName && controls[newName]) {
                    setDialogConfig({
                        open: true,
                        title: "Error",
                        message: "A collection or chapter with this name already exists.",
                        confirmLabel: "OK",
                        onConfirm: null,
                    });
                    return;
                }

                // Update Controls (Preserve Order)
                setControls((prev) => {
                    const newControls = {};
                    Object.keys(prev).forEach((key) => {
                        if (key === oldName) {
                            newControls[newName] = { ...prev[key] };
                        } else {
                            newControls[key] = { ...prev[key] };
                        }
                    });
                    return newControls;
                });

                // Update Rows (Header name and Child parentNames)
                setFormattedRows((prev) => {
                    let updated = prev.map((r) => {
                        if (r.id === id) {
                            return { ...r, name: newName, timestamp: newTimestamp || r.timestamp, isEditing: false };
                        }
                        if (r.parentName === oldName) {
                            return { ...r, parentName: newName };
                        }
                        return r;
                    });

                    // If timestamp changed, we might need to re-sort and re-parent
                    if (newTimestamp && newTimestamp !== row.timestamp) {
                        updated = recalculateStructure(updated);
                    }
                    return updated;
                });
            } else {
                // Normal Tag Edit
                setFormattedRows((prev) => {
                    const updated = prev.map((r) =>
                        r.id === id
                            ? { ...r, text: sanitizedValue, timestamp: newTimestamp || r.timestamp, isEditing: false }
                            : r,
                    );

                    // If timestamp changed (and it's a timeline tag), recalculate
                    // We check if it's not collection/hbd inside the helper mostly, but here we can just pass it all.
                    if (newTimestamp && newTimestamp !== row.timestamp) {
                        return recalculateStructure(updated);
                    }
                    return updated;
                });
            }

            setEditingId(null);
        },
        [formattedRows, controls, cancelEdit, setControls, setFormattedRows],
    );

    const toggleControl = (name) => {
        const isEnabled = controls[name]?.isEnabled;
        const newState = !isEnabled;

        setControls((prev) => ({
            ...prev,
            [name]: { ...prev[name], isEnabled: newState },
        }));

        setFormattedRows((prevRows) =>
            prevRows.map((r) => (r.type === "header" && r.name === name ? { ...r, isEnabled: newState } : r)),
        );
    };

    const moveControl = (name, direction) => {
        setControls((prev) => {
            const sortedKeys = Object.keys(prev)
                .filter((k) => prev[k].type === "collection")
                .sort((a, b) => prev[a].order - prev[b].order);

            const index = sortedKeys.indexOf(name);
            if (index < 0) return prev; // Should not happen

            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= sortedKeys.length) return prev;

            const neighborKey = sortedKeys[newIndex];
            const newControls = { ...prev };

            // Swap orders
            const tempOrder = newControls[name].order;
            newControls[name] = { ...newControls[name], order: newControls[neighborKey].order };
            newControls[neighborKey] = { ...newControls[neighborKey], order: tempOrder };

            return newControls;
        });
    };

    // Jump to row logic
    const rowRefs = useRef({});
    const [highlightedRowId, setHighlightedRowId] = useState(null);
    const [hoveredParent, setHoveredParent] = useState(null);

    const handleRowHover = useCallback((parentName) => {
        setHoveredParent(parentName || null);
    }, []);

    const scrollToRow = (name) => {
        // Find the first header with this name
        const id = formattedRows.find((r) => r.type === "header" && r.name === name)?.id;
        if (id && rowRefs.current[id]) {
            rowRefs.current[id].scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedRowId(id);
            setTimeout(() => setHighlightedRowId(null), 3000);
        }
    };

    const [isCopied, setIsCopied] = useState(false);

    const handleCopyFormatted = () => {
        const output = getFormattedOutput();
        navigator.clipboard.writeText(output);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const [dialogConfig, setDialogConfig] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        confirmLabel: "Yes",
        cancelLabel: "Cancel",
    });

    const [bulkEdit, setBulkEdit] = useState({
        offsetStart: "",
        offsetEnd: "",
        offsetAmount: "",
        enableStart: "",
        enableEnd: "",
        findText: "",
        replaceText: "",
        highlightThreshold: 30,
        isHighlightTime: false,
        isHighlightStar: false,
        isHighlightCaps: false,
        isHighlightCensored: false,
        lastFilterType: "none",
    });

    const handleBulkEditChange = (field, value) => {
        let newValue = value;
        // Restrict timestamp fields to numbers and colons only
        if (
            ["offsetStart", "offsetEnd", "offsetAmount", "enableStart", "enableEnd", "highlightThreshold"].includes(
                field,
            )
        ) {
            newValue = value.replace(/[^0-9:]/g, "");
        }
        setBulkEdit((prev) => ({ ...prev, [field]: newValue }));
    };

    const applyOffset = (direction) => {
        // direction: 1 or -1
        if (!bulkEdit.offsetAmount) return;
        const start = timeToSeconds(bulkEdit.offsetStart);
        const end = bulkEdit.offsetEnd ? timeToSeconds(bulkEdit.offsetEnd) : Infinity;
        const amount = timeToSeconds(bulkEdit.offsetAmount) * direction;

        setFormattedRows((prev) => {
            const updated = prev.map((row) => {
                if (!row.timestamp) return row;
                const t = timeToSeconds(row.timestamp);
                if (t >= start && t <= end) {
                    return { ...row, timestamp: secondsToTime(t + amount) };
                }
                return row;
            });
            // Always recalculate structure on offset since things might move relative to chapters (if chapters weren't moved but tags were, or vice versa)
            return recalculateStructure(updated);
        });
    };

    const applyEnableDisable = (enable) => {
        const start = timeToSeconds(bulkEdit.enableStart);
        const end = bulkEdit.enableEnd ? timeToSeconds(bulkEdit.enableEnd) : Infinity;

        setFormattedRows((prev) =>
            prev.map((row) => {
                if (row.type !== "tag" || !row.timestamp) return row;
                const t = timeToSeconds(row.timestamp);
                if (t >= start && t <= end) {
                    return { ...row, isEnabled: enable };
                }
                return row;
            }),
        );
    };

    const applyFindReplace = () => {
        if (!bulkEdit.findText) return;
        const regex = new RegExp(bulkEdit.findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

        let matchesCount = 0;
        const newRows = formattedRows.map((row) => {
            if (row.type !== "tag") return row;
            const matches = row.text.match(regex);
            if (matches) {
                matchesCount += matches.length;
                return { ...row, text: row.text.replace(regex, bulkEdit.replaceText) };
            }
            return row;
        });

        if (matchesCount > 0) {
            setFormattedRows(newRows);
        }

        setDialogConfig({
            open: true,
            title: "Replace Results",
            message:
                matchesCount > 0
                    ? `Replaced ${matchesCount} instance${matchesCount !== 1 ? "s" : ""}.`
                    : "No matches found.",
            confirmLabel: "OK",
            onConfirm: null,
        });
    };

    // --- Renders ---

    const displayedRows = useMemo(() => {
        const enabledCollections = []; // [[Header, Tag, Tag...], [Header, Tag...]]
        const timelineRows = []; // [Tag, Header, Tag...] mixed

        // Helper filter
        let currentCollectionGroup = null;

        for (let i = 0; i < formattedRows.length; i++) {
            const row = formattedRows[i];

            // If it's a Header
            if (row.type === "header") {
                const control = controls[row.name];
                if (row.subtype === "hbd") {
                    // HBDs are separate.
                    if (!control || control.isEnabled) {
                        timelineRows.push(row);
                    } else {
                        // Even if disabled, push it to allow user to re-enable via row (and see it)
                        timelineRows.push(row);
                    }
                    currentCollectionGroup = null;
                    continue;
                }

                if (row.subtype === "collection") {
                    if (control && control.isEnabled) {
                        currentCollectionGroup = [row];
                        enabledCollections.push(currentCollectionGroup);
                    } else {
                        // Disabled Collection: Header Hidden (don't push), tags go to timeline
                        currentCollectionGroup = null;
                    }
                } else {
                    // Chapter or others
                    // If Enabled: Header goes to Timeline
                    // If Disabled: Header Hidden
                    if (!control || control.isEnabled) {
                        timelineRows.push(row);
                    }
                    currentCollectionGroup = null;
                }
            } else {
                // It's a Tag
                if (row.subtype === "collection") {
                    // Check if parent is enabled
                    const parentName = row.parentName;
                    const control = controls[parentName];

                    if (control && control.isEnabled) {
                        // Part of enabled collection group
                        if (currentCollectionGroup) {
                            currentCollectionGroup.push(row);
                        } else {
                            timelineRows.push(row);
                        }
                    } else {
                        // Parent disabled: Push to timeline, it's now a 'loose' tag
                        timelineRows.push(row);
                    }
                } else if (row.subtype === "chapter") {
                    timelineRows.push(row);
                } else {
                    // Normal / HBD
                    timelineRows.push(row);
                }
            }
        }

        const getSeconds = (r) => timeToSeconds(r.timestamp || "00:00");

        timelineRows.sort((a, b) => {
            // HBD check - if subtype HBD, usually at end?
            const isHbdA = a.subtype === "hbd" || (!a.timestamp && a.text?.includes("HBD"));
            const isHbdB = b.subtype === "hbd" || (!b.timestamp && b.text?.includes("HBD"));
            if (isHbdA && !isHbdB) return 1;
            if (!isHbdA && isHbdB) return -1;

            return getSeconds(a) - getSeconds(b);
        });

        // Sort Enabled Collections by Control Order
        enabledCollections.sort((a, b) => {
            const nameA = a[0].name;
            const nameB = b[0].name;
            return (controls[nameA]?.order || 0) - (controls[nameB]?.order || 0);
        });

        // Flatten Enabled Collections
        const flatCollections = enabledCollections.flat();

        return [...flatCollections, ...timelineRows];
    }, [formattedRows, controls]);

    const getFormattedOutput = () => {
        // 1. Filter out individually disabled rows
        const enabledRows = displayedRows.filter((r) => r.isEnabled);

        // 2. Count enabled children for headers to handle "Implicitly Disabled Groups"
        const childrenCount = {};
        enabledRows.forEach((r) => {
            if (r.type === "tag" && r.parentName) {
                childrenCount[r.parentName] = (childrenCount[r.parentName] || 0) + 1;
            }
        });

        // 3. Filter valid rows (remove headers with no children)
        const validRows = enabledRows.filter((r) => {
            if (r.type === "header") {
                // Keep header only if it has children in the filtered list
                return childrenCount[r.name] > 0;
            }
            return true;
        });

        // 4. Format to string
        const result = validRows.map((row, index) => {
            let prefix = "";
            if (index > 0) {
                // Check if we just quit an enabled collection group
                const prevRow = validRows[index - 1];

                const isPrevCollection =
                    prevRow.subtype === "collection" &&
                    (prevRow.type === "header"
                        ? controls[prevRow.name]?.isEnabled
                        : controls[prevRow.parentName]?.isEnabled);
                const isCurrCollection =
                    row.subtype === "collection" &&
                    (row.type === "header" ? controls[row.name]?.isEnabled : controls[row.parentName]?.isEnabled);

                if (isPrevCollection && !isCurrCollection) {
                    // Boundary Detected.
                    if (row.type !== "header") {
                        // If next is NOT a header (e.g. normal tag), add separation
                        prefix = "\n";
                    }
                }

                if (row.type === "header") {
                    // Headers always get a space before them (unless index 0, handled by index>0 check)
                    prefix = "\n";
                }
            }

            if (row.type === "header") {
                return `${prefix}*${row.name}*`;
            }
            if (prefix.length > 0) {
                // Don't trim since that would remove the prefix
                return `${prefix}${row.timestamp} ${row.text}`;
            }
            return `${row.timestamp} ${row.text}`.trim();
        });
        return result.join("\n");
    };

    const renderInputSection = () => (
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
                >
                    Clear Input
                </Button>
            </Box>
            <TextField
                label="Input Tags"
                multiline
                fullWidth
                variant="outlined"
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
                <Button variant="outlined" color="secondary" onClick={handleClear}>
                    Reset Data
                </Button>
                {formattedRows.length > 0 && (
                    <Button variant="contained" color="secondary" onClick={() => setView("formatted")}>
                        Return to Formatted
                    </Button>
                )}
                {/* Append Button if formatted rows exist */}
                {formattedRows.length > 0 && inputTags.trim().length > 0 && (
                    <Button variant="contained" color="success" onClick={handleAppend}>
                        Append Tags
                    </Button>
                )}

                {/* Normal Format Button - Only show warning if over-writing */}
                {inputTags.trim().length > 0 && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            if (formattedRows.length > 0) {
                                setDialogConfig({
                                    open: true,
                                    title: "Re-Format Tags",
                                    message:
                                        "This will reset any changes you made in the formatted view (edits, sorting, etc.). Are you sure?",
                                    confirmLabel: "Format",
                                    onConfirm: () => handleFormat(),
                                });
                            } else {
                                handleFormat();
                            }
                        }}
                    >
                        {formattedRows.length > 0 ? "Re-Format Tags" : "Format Tags"}
                    </Button>
                )}

                {/* Hide Format from Clipboard if we already have data (user should use Append via Input) */}
                {formattedRows.length === 0 && (
                    <Button variant="outlined" onClick={handleFormatFromClipboard}>
                        Format from Clipboard
                    </Button>
                )}
            </Box>
        </Box>
    );

    const density = useAppStore((state) => state.density);

    const densityStyles = useMemo(() => {
        switch (density) {
            case "compact":
                return { py: 0, minHeight: "28px" };
            case "comfortable":
                return { py: 1, minHeight: "42px" };
            default:
                return { py: 0.2, minHeight: "36px" };
        }
    }, [density]);
    const registerRef = useCallback((id, el) => {
        rowRefs.current[id] = el;
    }, []);

    const highlightStats = useMemo(() => {
        const rowColors = {};
        let countTime = 0;
        let countStar = 0;
        let countCaps = 0;
        let countCensored = 0;

        const timeIds = new Set();

        // 1. Time Delta
        if (bulkEdit.isHighlightTime) {
            const threshold = parseFloat(bulkEdit.highlightThreshold) || 0;
            let lastTime = -1;
            let lastId = null;
            displayedRows.forEach((row) => {
                const isParentDisabled =
                    row.parentName && controls[row.parentName] && !controls[row.parentName].isEnabled;
                const isCollection = row.subtype === "collection";
                const isHbd = row.subtype === "hbd" || row.parentName === birthdayText;

                if (row.type === "tag" && row.isEnabled && !isParentDisabled && !isCollection && !isHbd) {
                    const t = row.timestamp ? timeToSeconds(row.timestamp) : -1;
                    if (t !== -1) {
                        if (lastTime !== -1) {
                            if (t - lastTime < threshold) {
                                timeIds.add(row.id);
                                if (lastId) timeIds.add(lastId);
                            }
                        }
                        lastTime = t;
                        lastId = row.id;
                    }
                }
            });
            countTime = timeIds.size;
        }

        // 2. Iterate for Colors and other counts
        displayedRows.forEach((row) => {
            if (row.type !== "tag") return;

            // Caps
            // Check condition regardless of overwrite for counting
            let isCaps = false;
            if (bulkEdit.isHighlightCaps) {
                const text = row.text.trim();
                // Contains letters and is all caps
                const hasLetters = /[a-zA-Z]/.test(text);
                if (hasLetters && text === text.toUpperCase()) {
                    isCaps = true;
                    countCaps++;
                }
            }

            // Star
            let isStar = false;
            if (bulkEdit.isHighlightStar && row.text.includes("*")) {
                isStar = true;
                countStar++;
            }

            // Censored
            let isCensored = false;
            if (bulkEdit.isHighlightCensored && row.wasCensored) {
                isCensored = true;
                countCensored++;
            }

            // Determine Winner Color
            let color = null;
            if (timeIds.has(row.id)) {
                color = theme.palette.background.yellow;
            }
            if (isCaps) {
                color = theme.palette.background.teal;
            }
            if (isStar) {
                color = theme.palette.background.red;
            }
            if (isCensored) {
                color = theme.palette.background.orange;
            }

            if (color) {
                rowColors[row.id] = color;
            }
        });

        return { rowColors, countTime, countStar, countCaps, countCensored };
    }, [displayedRows, bulkEdit, controls, birthdayText, theme]);

    const renderFormattedTags = () => {
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

                    <Button variant="outlined" color="secondary" size="small" onClick={() => setView("input")}>
                        Back to Input
                    </Button>

                    <Button
                        variant="contained"
                        color={isCopied ? "success" : "primary"}
                        startIcon={isCopied ? <Check /> : <ContentCopy />}
                        onClick={handleCopyFormatted}
                        size="small"
                    >
                        {isCopied ? "Copied!" : "Copy to Clipboard"}
                    </Button>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
                    {displayedRows.map((row, index) => {
                        // Visual Filter Logic based on Controls
                        const parentControl = row.parentName ? controls[row.parentName] : null;
                        const isParentDisabled = parentControl && !parentControl.isEnabled;

                        // Boundary check for visual spacing
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
                                extraMarginTop = 2; // Add visual gap
                            }
                        }

                        // If Header and Parent Disabled -> Don't Render
                        if (row.type === "header" && isParentDisabled) return null;

                        // Headers Prop Calculation
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
    };

    const renderControls = () => {
        // Pre-calculate status for visual feedback
        const groupHasEnabledChildren = {};
        // Helper to count enabled children per group
        formattedRows.forEach((row) => {
            if (row.type === "tag" && row.isEnabled && row.parentName) {
                groupHasEnabledChildren[row.parentName] = true;
            }
        });

        return (
            <Paper
                elevation={3}
                sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1, overflow: "hidden" }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Headers
                </Typography>
                <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
                    {/* Collections */}
                    {Object.keys(controls)
                        .filter((key) => controls[key].type === "collection")
                        .sort((a, b) => (controls[a].order || 0) - (controls[b].order || 0))
                        .map((key, index, array) => {
                            const hasChildren = groupHasEnabledChildren[key];
                            const isCrossedOut = !hasChildren && controls[key].isEnabled;

                            return (
                                <Box key={key} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <Checkbox
                                        checked={controls[key].isEnabled}
                                        onChange={() => toggleControl(key)}
                                        size="small"
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            textDecoration: isCrossedOut ? "line-through" : "none",
                                            opacity: isCrossedOut ? 0.6 : 1,
                                        }}
                                        onClick={() => scrollToRow(key)}
                                    >
                                        {key}
                                    </Typography>
                                    <Box sx={{ flexGrow: 1 }} />
                                    {index > 0 && (
                                        <IconButton size="small" onClick={() => moveControl(key, -1)}>
                                            <ArrowUpward fontSize="small" />
                                        </IconButton>
                                    )}
                                    {index < array.length - 1 && (
                                        <IconButton size="small" onClick={() => moveControl(key, 1)}>
                                            <ArrowDownward fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            );
                        })}

                    {/* Chapters */}
                    {Object.keys(controls)
                        .filter((key) => controls[key].type === "chapter")
                        .sort((a, b) => {
                            const rowA = formattedRows.find((r) => r.type === "header" && r.name === a);
                            const rowB = formattedRows.find((r) => r.type === "header" && r.name === b);

                            const timeA = rowA ? timeToSeconds(rowA.timestamp) : Infinity;
                            const timeB = rowB ? timeToSeconds(rowB.timestamp) : Infinity;

                            return timeA - timeB;
                        })
                        .map((key) => {
                            const hasChildren = groupHasEnabledChildren[key];
                            const isCrossedOut = !hasChildren && controls[key].isEnabled;
                            const isHovered = key === hoveredParent;

                            return (
                                <Box
                                    key={key}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mb: 1,
                                        bgcolor: isHovered ? "action.hover" : "transparent",
                                        borderRadius: 1,
                                        pr: 1,
                                    }}
                                >
                                    <Checkbox
                                        checked={controls[key].isEnabled}
                                        onChange={() => toggleControl(key)}
                                        size="small"
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            color: orange[900],
                                            textDecoration: isCrossedOut ? "line-through" : "none",
                                            opacity: isCrossedOut ? 0.6 : 1,
                                        }}
                                        onClick={() => scrollToRow(key)}
                                    >
                                        {key}
                                    </Typography>
                                </Box>
                            );
                        })}

                    {/* HBD */}
                    {Object.keys(controls)
                        .filter((key) => controls[key].type === "hbd")
                        .map((key) => {
                            const hasChildren = groupHasEnabledChildren[key];
                            const isCrossedOut = !hasChildren && controls[key].isEnabled;

                            return (
                                <Box key={key} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <Checkbox
                                        checked={controls[key].isEnabled}
                                        disabled
                                        onChange={() => toggleControl(key)}
                                        sx={{
                                            visibility: "hidden",
                                        }}
                                        size="small"
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            color: "primary.main",
                                            textDecoration: isCrossedOut ? "line-through" : "none",
                                            opacity: isCrossedOut ? 0.6 : 1,
                                        }}
                                        onClick={() => scrollToRow(key)}
                                    >
                                        {key}
                                    </Typography>
                                </Box>
                            );
                        })}
                </Box>
            </Paper>
        );
    };

    const renderBulkEdit = () => (
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
                        value={bulkEdit.offsetStart}
                        onChange={(e) => handleBulkEditChange("offsetStart", e.target.value)}
                    />
                    <TextField
                        label="End"
                        size="small"
                        placeholder="01:00"
                        value={bulkEdit.offsetEnd}
                        onChange={(e) => handleBulkEditChange("offsetEnd", e.target.value)}
                    />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                        label="Offset"
                        size="small"
                        placeholder="00:05"
                        value={bulkEdit.offsetAmount}
                        onChange={(e) => handleBulkEditChange("offsetAmount", e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <Tooltip title="Add offset to timestamp">
                        <Button variant="contained" size="small" onClick={() => applyOffset(1)}>
                            +
                        </Button>
                    </Tooltip>
                    <Tooltip title="Subtract offset from timestamp">
                        <Button variant="contained" size="small" color="warning" onClick={() => applyOffset(-1)}>
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
                        value={bulkEdit.enableStart}
                        onChange={(e) => handleBulkEditChange("enableStart", e.target.value)}
                    />
                    <TextField
                        label="End"
                        size="small"
                        placeholder="01:00"
                        value={bulkEdit.enableEnd}
                        onChange={(e) => handleBulkEditChange("enableEnd", e.target.value)}
                    />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" size="small" fullWidth onClick={() => applyEnableDisable(true)}>
                        Enable
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        color="error"
                        onClick={() => applyEnableDisable(false)}
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
                    value={bulkEdit.findText}
                    onChange={(e) => handleBulkEditChange("findText", e.target.value)}
                />
                <TextField
                    label="Replace"
                    size="small"
                    fullWidth
                    sx={{ mb: 1 }}
                    value={bulkEdit.replaceText}
                    onChange={(e) => handleBulkEditChange("replaceText", e.target.value)}
                />
                <Button variant="contained" size="small" fullWidth onClick={applyFindReplace}>
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
                        />
                        <Typography variant="body2" sx={{ mr: 0.5, whiteSpace: "nowrap" }}>
                            seconds apart
                        </Typography>
                    </Box>
                    {bulkEdit.isHighlightTime && (
                        <Box sx={{ pl: 5, mt: 0.5 }}>
                            <Box
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
                    />
                    <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                        are censored/filtered
                    </Typography>
                    {bulkEdit.isHighlightCensored && (
                        <Box
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
                    />
                    <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                        contain a *
                    </Typography>
                    {bulkEdit.isHighlightStar && (
                        <Box sx={{ pl: 5, mt: 0.5 }}>
                            <Box
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
                    />
                    <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                        are all caps
                    </Typography>
                    {bulkEdit.isHighlightCaps && (
                        <Box sx={{ pl: 5, mt: 0.5 }}>
                            <Box
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

    // Main Layout
    return (
        <>
            {view === "input" ? (
                renderInputSection()
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        height: "calc(100vh - 64px)",
                        p: 2,
                        gap: 2,
                    }}
                >
                    {/* Formatted Tags Area */}
                    <Box
                        sx={{
                            flexMatched: true,
                            flex: isMobile ? "0 0 500px" : "0 0 70%",
                            height: isMobile ? "50vh" : "100%",
                            overflow: "hidden",
                        }}
                    >
                        {renderFormattedTags()}
                    </Box>

                    {/* Right Side / Bottom Area */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            flex: isMobile ? 1 : "0 0 30%",
                            height: isMobile ? "auto" : "100%",
                            gap: 2,
                        }}
                    >
                        {/* Controls */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                flex: isMobile ? 1 : "0 1 auto",
                                maxHeight: isMobile ? "none" : "50%",
                                overflow: "hidden",
                            }}
                        >
                            {renderControls()}
                        </Box>

                        {/* Group Edit */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                overflow: "hidden",
                            }}
                        >
                            {renderBulkEdit()}
                        </Box>
                    </Box>
                </Box>
            )}

            <Dialog open={dialogConfig.open} onClose={() => setDialogConfig((prev) => ({ ...prev, open: false }))}>
                <DialogTitle>{dialogConfig.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{dialogConfig.message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    {dialogConfig.onConfirm && (
                        <Button onClick={() => setDialogConfig((prev) => ({ ...prev, open: false }))} color="primary">
                            {dialogConfig.cancelLabel}
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                            setDialogConfig((prev) => ({ ...prev, open: false }));
                        }}
                        color="secondary"
                        autoFocus
                    >
                        {dialogConfig.confirmLabel || "OK"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TagFormatter;
