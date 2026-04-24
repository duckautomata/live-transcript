// oxlint-disable react-hooks/set-state-in-effect
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { Edit, FormatListBulleted, MenuBook } from "@mui/icons-material";
import { timeToSeconds, secondsToTime, recalculateStructure, parseRawInput, mergeTags } from "../../logic/tagHelpers";
import { useAppStore } from "../../store/store";
import { LOG_ERROR } from "../../logic/debug";
import { InputView } from "./InputView";
import { FormattedTagsList } from "./FormattedTagsList";
import { ControlsPanel } from "./ControlsPanel";
import { BulkEditPanel } from "./BulkEditPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { computeDisplayedRows, computeHighlightStats, buildFormattedOutput } from "./tagFormatterLogic";

/**
 * Component for manually fixing and formatting transcript tags.
 * 4-part layout: Input, Formatted, Controls, Group Edit.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
const TagFormatter = ({ wsKey }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const birthdayText = wsKey === "doki" ? "Dragoon Birthdays" : "Birthdays!";

    const [view, setView] = useState("input");
    const [loadedKey, setLoadedKey] = useState(null);
    const [mobileTab, setMobileTab] = useState("tags");

    const inputTags = useAppStore((state) => state.inputTags);
    const setInputTags = useAppStore((state) => state.setInputTags);
    const formattedRows = useAppStore((state) => state.formattedRows);
    const setFormattedRows = useAppStore((state) => state.setFormattedRows);
    const controls = useAppStore((state) => state.controls);
    const setControls = useAppStore((state) => state.setControls);
    const density = useAppStore((state) => state.density);

    const [editingId, setEditingId] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [highlightedRowId, setHighlightedRowId] = useState(null);
    const [hoveredParent, setHoveredParent] = useState(null);
    const rowRefs = useRef({});

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

    // Load/Persist view state per wsKey
    useEffect(() => {
        const savedView = localStorage.getItem(`tagFormatter_view_${wsKey}`);
        if (savedView) setView(savedView);
        setLoadedKey(wsKey);
    }, [wsKey]);

    useEffect(() => {
        if (loadedKey !== wsKey) return;
        localStorage.setItem(`tagFormatter_view_${wsKey}`, view);
    }, [view, wsKey, loadedKey]);

    // --- Formatting actions ---

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

    const handleFormat = (textToFormat = inputTags) => {
        if (!textToFormat.trim()) return;

        const { newRows, newControls } = parseRawInput(textToFormat, wsKey, birthdayText);

        setFormattedRows(newRows);
        setControls(newControls);
        setView("formatted");
    };

    const handleFormatClick = () => {
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

    // --- Row actions ---

    const toggleRowEnabled = useCallback(
        (id) => {
            const row = formattedRows.find((r) => r.id === id);
            if (!row) return;

            const newState = !row.isEnabled;

            if (row.type === "header") {
                setControls((prevControls) => {
                    const control = prevControls[row.name];
                    if (control) {
                        return { ...prevControls, [row.name]: { ...control, isEnabled: newState } };
                    }
                    return prevControls;
                });

                setFormattedRows((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: newState } : r)));
            } else {
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

                    if (newTimestamp && newTimestamp !== row.timestamp) {
                        updated = recalculateStructure(updated);
                    }
                    return updated;
                });
            } else {
                setFormattedRows((prev) => {
                    const updated = prev.map((r) =>
                        r.id === id
                            ? { ...r, text: sanitizedValue, timestamp: newTimestamp || r.timestamp, isEditing: false }
                            : r,
                    );

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

    // --- Controls actions ---

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
            if (index < 0) return prev;

            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= sortedKeys.length) return prev;

            const neighborKey = sortedKeys[newIndex];
            const newControls = { ...prev };

            const tempOrder = newControls[name].order;
            newControls[name] = { ...newControls[name], order: newControls[neighborKey].order };
            newControls[neighborKey] = { ...newControls[neighborKey], order: tempOrder };

            return newControls;
        });
    };

    // --- Hover / scroll ---

    const handleRowHover = useCallback((parentName) => {
        setHoveredParent(parentName || null);
    }, []);

    const registerRef = useCallback((id, el) => {
        rowRefs.current[id] = el;
    }, []);

    const scrollToRow = (name) => {
        const id = formattedRows.find((r) => r.type === "header" && r.name === name)?.id;
        if (id && rowRefs.current[id]) {
            rowRefs.current[id].scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedRowId(id);
            setTimeout(() => setHighlightedRowId(null), 3000);
        }
    };

    // --- Copy ---

    const handleCopyFormatted = () => {
        const output = buildFormattedOutput(displayedRows, controls);
        navigator.clipboard.writeText(output);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- Bulk edit ---

    const handleBulkEditChange = (field, value) => {
        let newValue = value;
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

    // --- Derived state ---

    const displayedRows = useMemo(() => computeDisplayedRows(formattedRows, controls), [formattedRows, controls]);

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

    const highlightStats = useMemo(
        () => computeHighlightStats(displayedRows, bulkEdit, controls, birthdayText, theme),
        [displayedRows, bulkEdit, controls, birthdayText, theme],
    );

    // --- Render ---

    const formattedPanel = (
        <FormattedTagsList
            displayedRows={displayedRows}
            formattedRows={formattedRows}
            controls={controls}
            editingId={editingId}
            startEditing={startEditing}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            toggleRowEnabled={toggleRowEnabled}
            densityStyles={densityStyles}
            theme={theme}
            highlightStats={highlightStats}
            highlightedRowId={highlightedRowId}
            registerRef={registerRef}
            handleRowHover={handleRowHover}
            hoveredParent={hoveredParent}
            onBackToInput={() => setView("input")}
            isCopied={isCopied}
            onCopy={handleCopyFormatted}
            isMobile={isMobile}
        />
    );

    const controlsPanel = (
        <ControlsPanel
            controls={controls}
            formattedRows={formattedRows}
            hoveredParent={hoveredParent}
            toggleControl={toggleControl}
            moveControl={moveControl}
            scrollToRow={scrollToRow}
        />
    );

    const bulkEditPanel = (
        <BulkEditPanel
            bulkEdit={bulkEdit}
            handleBulkEditChange={handleBulkEditChange}
            applyOffset={applyOffset}
            applyEnableDisable={applyEnableDisable}
            applyFindReplace={applyFindReplace}
            highlightStats={highlightStats}
            theme={theme}
            isMobile={isMobile}
        />
    );

    return (
        <>
            {view === "input" ? (
                <InputView
                    inputTags={inputTags}
                    setInputTags={setInputTags}
                    formattedRows={formattedRows}
                    onClear={handleClear}
                    onReturnToFormatted={() => setView("formatted")}
                    onAppend={handleAppend}
                    onFormat={handleFormatClick}
                    onFormatFromClipboard={handleFormatFromClipboard}
                />
            ) : isMobile ? (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "calc(100vh - 64px)",
                        p: 1,
                        gap: 1,
                    }}
                >
                    <Tabs
                        value={mobileTab}
                        onChange={(_, v) => setMobileTab(v)}
                        variant="fullWidth"
                        sx={{
                            minHeight: 40,
                            borderBottom: 1,
                            borderColor: "divider",
                            "& .MuiTab-root": { minHeight: 40, py: 0.5, textTransform: "none" },
                        }}
                    >
                        <Tab
                            icon={<FormatListBulleted fontSize="small" />}
                            iconPosition="start"
                            label="Tags"
                            value="tags"
                            data-testid="tag-mobile-tab-tags"
                        />
                        <Tab
                            icon={<MenuBook fontSize="small" />}
                            iconPosition="start"
                            label="Headers"
                            value="headers"
                            data-testid="tag-mobile-tab-headers"
                        />
                        <Tab
                            icon={<Edit fontSize="small" />}
                            iconPosition="start"
                            label="Bulk Edit"
                            value="bulk"
                            data-testid="tag-mobile-tab-bulk"
                        />
                    </Tabs>
                    <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
                        {mobileTab === "tags" && formattedPanel}
                        {mobileTab === "headers" && controlsPanel}
                        {mobileTab === "bulk" && bulkEditPanel}
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        height: "calc(100vh - 64px)",
                        p: 2,
                        gap: 2,
                    }}
                >
                    <Box sx={{ flex: "0 0 68%", height: "100%", overflow: "hidden" }}>{formattedPanel}</Box>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            flex: "0 0 32%",
                            height: "100%",
                            gap: 2,
                            minWidth: 0,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                flex: "0 1 auto",
                                maxHeight: "45%",
                                overflow: "hidden",
                            }}
                        >
                            {controlsPanel}
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                overflow: "hidden",
                            }}
                        >
                            {bulkEditPanel}
                        </Box>
                    </Box>
                </Box>
            )}

            <ConfirmDialog dialogConfig={dialogConfig} setDialogConfig={setDialogConfig} />
        </>
    );
};

export default TagFormatter;
