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
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { genericCensor, mintCensor } from "../logic/censors";
import { HBD_formatting, compareKeys } from "../logic/formatting";
import { orange, purple } from "@mui/material/colors";
import { Check, ContentCopy, Edit, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { useAppStore } from "../store/store";
import { LOG_ERROR } from "../logic/debug";
// Helpers
const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
};

// Helper: Recalculate collection/chapter structure based on timestamps
const recalculateStructure = (rows) => {
    // 1. Separate into categories
    const collectionRows = []; // Headers and their children
    const hbdRows = []; // HBD Header and children
    const timelineRows = []; // Normal Tags and Chapter Headers

    rows.forEach((row) => {
        if (row.subtype === "collection") {
            collectionRows.push(row);
        } else if (row.subtype === "hbd") {
            hbdRows.push(row);
        } else {
            timelineRows.push(row);
        }
    });

    // 2. Sort Timeline Rows by Timestamp
    timelineRows.sort((a, b) => {
        const timeA = timeToSeconds(a.timestamp);
        const timeB = timeToSeconds(b.timestamp);
        return timeA - timeB;
    });

    // 3. Re-assign Parents for Timeline Tags
    let currentChapter = null;
    const updatedTimelineRows = timelineRows.map((row) => {
        if (row.type === "header" && row.subtype === "chapter") {
            currentChapter = row.name;
            return row;
        } else if (row.type === "tag") {
            // It's a normal tag (or was under a chapter)
            // Assign to current chapter (if any)
            return { ...row, parentName: currentChapter };
        }
        return row;
    });

    // 4. Recombine
    return [...collectionRows, ...updatedTimelineRows, ...hbdRows];
};

const secondsToTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    // Format based on current convention (if < 1hr, MM:SS, else HH:MM:SS)
    if (h > 0) {
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

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
        isHighlightedLowDelta,
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
                            <Typography sx={{ fontWeight: "bold", textDecoration: headerDecoration }}>
                                {isChapter && row.timestamp && (
                                    <span style={{ marginRight: "8px", opacity: 0.8 }}>{row.timestamp}</span>
                                )}
                                *{row.name}*
                            </Typography>
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
                        : isHighlightedLowDelta
                          ? theme.palette.background.important
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
                        variant="standard"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        autoFocus
                        onKeyDown={handleKeyDown}
                        sx={{ flexGrow: 1 }}
                    />
                ) : (
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
    const [inputTags, setInputTags] = useState("");

    // The main data structure: Array of 'Row' objects
    // Row: { id, type: 'tag'|'header', subtype: 'chapter'|'collection'|'normal'|'hbd',
    //        timestamp, text, originalText, name (for headers),
    //        isEnabled, isEditing, parentName (for tags under chapter/collection) }
    const [formattedRows, setFormattedRows] = useState([]);

    // Controls State
    // { [name]: { isEnabled: boolean, order: number (for collections), type: 'chapter'|'collection' } }
    const [controls, setControls] = useState({});

    const [editingId, setEditingId] = useState(null);

    const [loadedKey, setLoadedKey] = useState(null);

    // --- Effects ---

    // Load all state on mount
    useEffect(() => {
        const savedInput = localStorage.getItem(`tagFormatter_input_${wsKey}`);
        const savedRows = localStorage.getItem(`tagFormatter_rows_${wsKey}`);
        const savedControls = localStorage.getItem(`tagFormatter_controls_${wsKey}`);
        const savedView = localStorage.getItem(`tagFormatter_view_${wsKey}`);

        if (savedInput) setInputTags(savedInput);
        if (savedRows) {
            try {
                setFormattedRows(JSON.parse(savedRows));
            } catch (e) {
                LOG_ERROR("Failed to load rows", e);
            }
        }
        if (savedControls) {
            try {
                setControls(JSON.parse(savedControls));
            } catch (e) {
                LOG_ERROR("Failed to load controls", e);
            }
        }
        if (savedView) setView(savedView);

        setLoadedKey(wsKey);
    }, [wsKey]);

    // Persist individually
    useEffect(() => {
        if (loadedKey !== wsKey) return;
        localStorage.setItem(`tagFormatter_input_${wsKey}`, inputTags);
    }, [inputTags, wsKey, loadedKey]);

    useEffect(() => {
        if (loadedKey !== wsKey) return;
        if (formattedRows.length > 0) {
            localStorage.setItem(`tagFormatter_rows_${wsKey}`, JSON.stringify(formattedRows));
        } else if (view === "input") {
            // Only save empty if we are in input mode (explicit clear)
            localStorage.setItem(`tagFormatter_rows_${wsKey}`, JSON.stringify(formattedRows));
        }
    }, [formattedRows, view, wsKey, loadedKey]);

    useEffect(() => {
        if (loadedKey !== wsKey) return;
        localStorage.setItem(`tagFormatter_controls_${wsKey}`, JSON.stringify(controls));
    }, [controls, wsKey, loadedKey]);

    useEffect(() => {
        if (loadedKey !== wsKey) return;
        localStorage.setItem(`tagFormatter_view_${wsKey}`, view);
    }, [view, wsKey, loadedKey]);

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

        // 1. Censors
        let processed = textToFormat
            .split("\n")
            .map((line) => {
                let newLine = genericCensor(line);
                if (wsKey === "mint") {
                    newLine = mintCensor(newLine);
                }
                return newLine;
            })
            .filter((line) => line.length > 0)
            .join("\n");

        // 2. HBD Formatting (moves HBDs to bottom)
        processed = HBD_formatting(processed, birthdayText);

        // 3. Parsing
        const lines = processed.split("\n").filter((line) => line.trim().length > 0);
        const newRows = [];
        const newControls = {};

        // Regexes
        const collectionRegex = /([\d:]+)\s+(.*?)\s*::\s*(.*)/i;
        const chapterRegex = /([\d:]+)\s+\[(.*?)\]\s*(.*)/i;
        const hbdHeaderRegex = /\*(Dragoon Birthdays|Birthdays!)\*/i;

        // Group Collections First
        const collectionGroups = new Map(); // name -> [lines]
        const remainingLines = [];

        lines.forEach((line) => {
            const match = line.match(collectionRegex);
            if (match) {
                const timestamp = match[1];
                const name = match[2];
                const text = match[3];
                // Resolve Key
                const key = [...collectionGroups.keys()].find((k) => compareKeys(k, name) >= 90) || name;

                if (!collectionGroups.has(key)) {
                    collectionGroups.set(key, []);
                }
                collectionGroups.get(key).push({ timestamp, text, originalLine: line, name: key });
            } else {
                remainingLines.push(line);
            }
        });

        let rowIdCounter = 0;

        // Build Collection Rows
        [...collectionGroups.keys()].forEach((name, index) => {
            // Add Control
            newControls[name] = { isEnabled: true, type: "collection", order: index };

            const groupItems = collectionGroups.get(name);
            const firstTimestamp = groupItems.length > 0 ? groupItems[0].timestamp : "00:00";

            // Add Header Row
            newRows.push({
                id: `col-header-${rowIdCounter++}`,
                type: "header",
                subtype: "collection",
                name: name,
                timestamp: firstTimestamp,
                isEnabled: true,
            });

            // Add Tag Rows
            groupItems.forEach((item) => {
                newRows.push({
                    id: `tag-${rowIdCounter++}`,
                    type: "tag",
                    subtype: "collection",
                    parentName: name,
                    timestamp: item.timestamp,
                    text: item.text,
                    originalText: item.text,
                    isEnabled: true,
                    isEditing: false,
                });
            });
        });

        let inHbdSection = false;
        let currentChapter = null;

        // Build Chapter & Normal Rows
        remainingLines.forEach((line) => {
            if (hbdHeaderRegex.test(line)) {
                inHbdSection = true;
                currentChapter = null; // Reset chapter context in HBD section
                // Add Control
                if (!newControls[birthdayText]) {
                    newControls[birthdayText] = { isEnabled: true, type: "hbd" };
                }

                newRows.push({
                    id: `hbd-header-${rowIdCounter++}`,
                    type: "header",
                    subtype: "hbd",
                    name: birthdayText,
                    isEnabled: true,
                });
                return;
            }

            const chapterMatch = line.match(chapterRegex);
            if (chapterMatch) {
                const timestamp = chapterMatch[1];
                const name = chapterMatch[2];
                const text = chapterMatch[3]; // might be empty if just a marker

                currentChapter = name; // Update context

                // Add Control
                if (!newControls[name]) {
                    newControls[name] = { isEnabled: true, type: "chapter" };
                }

                // Add Header Row
                newRows.push({
                    id: `chap-header-${rowIdCounter++}-${name}`,
                    type: "header",
                    subtype: "chapter",
                    name: name,
                    timestamp: timestamp,
                    isEnabled: true,
                });

                // Add Tag Row
                if (text && text.trim().length > 0) {
                    newRows.push({
                        id: `tag-${rowIdCounter++}`,
                        type: "tag",
                        subtype: "chapter",
                        parentName: name,
                        timestamp: timestamp,
                        text: text,
                        originalText: text,
                        isEnabled: true,
                        isEditing: false,
                    });
                }
            } else {
                // Normal Tag or HBD content
                // Check if it looks like a tag (starts with timestamp)
                const timestampMatch = line.match(/^([\d:]+)\s+(.*)/);
                if (timestampMatch) {
                    newRows.push({
                        id: `tag-${rowIdCounter++}`,
                        type: "tag",
                        subtype: inHbdSection ? "hbd" : "normal",
                        parentName: inHbdSection ? birthdayText : currentChapter, // Assign parent
                        timestamp: timestampMatch[1],
                        text: timestampMatch[2],
                        originalText: timestampMatch[2],
                        isEnabled: true,
                        isEditing: false,
                    });
                } else {
                    // Just a line (maybe HBD name)
                    newRows.push({
                        id: `tag-${rowIdCounter++}`,
                        type: "tag",
                        subtype: inHbdSection ? "hbd" : "normal", // treated as normal
                        timestamp: "", // no timestamp
                        text: line,
                        originalText: line,
                        isEnabled: true,
                        isEditing: false,
                    });
                }
            }
        });

        setFormattedRows(newRows);
        setControls(newControls);
        setView("formatted");
    };

    // --- Actions ---

    const toggleRowEnabled = useCallback((id) => {
        setFormattedRows((prev) => prev.map((row) => (row.id === id ? { ...row, isEnabled: !row.isEnabled } : row)));
    }, []);

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

            if (row.type === "header") {
                const oldName = row.name;
                const newName = newValue.trim();

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
                            ? { ...r, text: newValue, timestamp: newTimestamp || r.timestamp, isEditing: false }
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
        [formattedRows, controls, cancelEdit],
    );

    const toggleControl = (name) => {
        setControls((prev) => ({
            ...prev,
            [name]: { ...prev[name], isEnabled: !prev[name].isEnabled },
        }));
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
        highlightThreshold: "30",
        isHighlightEnabled: false,
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

        setFormattedRows((prev) =>
            prev.map((row) => {
                if (row.type !== "tag") return row;
                // Only replace in text
                return { ...row, text: row.text.replace(regex, bulkEdit.replaceText) };
            }),
        );
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
                <Button variant="outlined" onClick={handleFormatFromClipboard}>
                    Format from Clipboard
                </Button>
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

    const renderFormattedTags = () => {
        // Pre-calculate highlighting for low delta timestamps
        const highlightedLowDeltaIds = new Set();
        if (bulkEdit.isHighlightEnabled) {
            const threshold = parseFloat(bulkEdit.highlightThreshold) || 0;
            let lastTime = -1;
            let lastId = null;

            displayedRows.forEach((row) => {
                // Check if row is visible/enabled essentially
                const isParentDisabled =
                    row.parentName && controls[row.parentName] && !controls[row.parentName].isEnabled;
                // Ignore Collections from this check
                const isCollection = row.subtype === "collection";
                const isHbd = row.subtype === "hbd" || row.parentName === birthdayText;

                if (row.type === "tag" && row.isEnabled && !isParentDisabled && !isCollection && !isHbd) {
                    // Check timestamp validity
                    const t = row.timestamp ? timeToSeconds(row.timestamp) : -1;
                    if (t !== -1) {
                        if (lastTime !== -1) {
                            if (t - lastTime < threshold) {
                                highlightedLowDeltaIds.add(row.id);
                                if (lastId) highlightedLowDeltaIds.add(lastId);
                            }
                        }
                        lastTime = t;
                        lastId = row.id;
                    }
                }
            });
        }

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
                        const headerOpacity = hasEnabledChildren ? 1 : 0.5;
                        const headerDecoration = hasEnabledChildren ? "none" : "line-through";

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
                                isHighlightedLowDelta={highlightedLowDeltaIds.has(row.id)}
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

            {/* Word Edit */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Word Edit
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
                    Highlight Analysis
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={bulkEdit.isHighlightEnabled}
                            onChange={(e) => handleBulkEditChange("isHighlightEnabled", e.target.checked)}
                            size="small"
                        />
                    }
                    label="Highlight timestamps"
                />
                <Typography variant="body2" gutterBottom>
                    less than
                </Typography>
                <TextField
                    label="Seconds apart"
                    size="small"
                    fullWidth
                    sx={{ mb: 1 }}
                    value={bulkEdit.highlightThreshold}
                    onChange={(e) => handleBulkEditChange("highlightThreshold", e.target.value)}
                    disabled={!bulkEdit.isHighlightEnabled}
                />
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
