import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    Paper,
    Tabs,
    Tab,
    Box,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Autocomplete,
} from "@mui/material";
import { useState } from "react";
import { calculateOffset, offsetToCommand, snowflakeToUnix } from "../logic/timestamp";
import { unixToRelative } from "../logic/dateTime";
import { secondsToTime, mergeTags } from "../logic/tagHelpers";
import { useAppStore } from "../store/store";

/**
 * A dialog for calculating the offset of a transcript tag relative to a Discord message ID.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket key for the current session.
 */
const TagOffsetPopup = ({ wsKey }) => {
    const tagPopupOpen = useAppStore((state) => state.tagPopupOpen);
    const setTagPopupOpen = useAppStore((state) => state.setTagPopupOpen);
    const tagPopupTimestamp = useAppStore((state) => state.tagPopupTimestamp);
    const tagPopupText = useAppStore((state) => state.tagPopupText);
    const defaultOffset = useAppStore((state) => state.defaultOffset);
    const setDefaultOffset = useAppStore((state) => state.setDefaultOffset);
    const startTime = useAppStore((state) => state.startTime);

    // ... (keep usage of useAppStore at top)
    const formattedRows = useAppStore((state) => state.formattedRows);
    const setFormattedRows = useAppStore((state) => state.setFormattedRows);
    const controls = useAppStore((state) => state.controls);
    const setControls = useAppStore((state) => state.setControls);

    const [activeTab, setActiveTab] = useState(0);
    const [tempDefaultOffset, setTempDefaultOffset] = useState(defaultOffset);
    const [snowflakeId, setSnowflakeId] = useState("");
    const [command, setCommand] = useState(null);
    const formattedTimestamp = unixToRelative(tagPopupTimestamp, startTime);

    // Tag Creator State
    const [tagText, setTagText] = useState("");
    const [tagType, setTagType] = useState("normal"); // normal, chapter, collection
    const [chapterName, setChapterName] = useState("");
    const [groupName, setGroupName] = useState("");

    const handleSnowflakeIdChange = (event) => {
        setSnowflakeId(event.target.value);
        let snowflakeUnix = null;
        let tagOffset = null;
        let tagOffsetCommand = null;
        try {
            snowflakeUnix = snowflakeToUnix(event.target.value);
            tagOffset = calculateOffset(tagPopupTimestamp, snowflakeUnix, tempDefaultOffset);
            tagOffsetCommand = offsetToCommand(tagOffset);
        } catch {
            tagOffsetCommand = null;
        }
        setCommand(tagOffsetCommand);
    };

    const handleDefaultOffsetChange = (event) => {
        setTempDefaultOffset(event.target.value);
        let snowflakeUnix = null;
        let tagOffset = null;
        let tagOffsetCommand = null;
        try {
            snowflakeUnix = snowflakeToUnix(snowflakeId);
            tagOffset = calculateOffset(tagPopupTimestamp, snowflakeUnix, event.target.value);
            tagOffsetCommand = offsetToCommand(tagOffset);
        } catch {
            tagOffsetCommand = null;
        }
        setCommand(tagOffsetCommand);
    };

    const handleCopyToClipboard = () => {
        if (command !== null) {
            navigator.clipboard.writeText(command.toString());
        }
    };

    const handleClose = () => {
        setTagPopupOpen(false);
        setDefaultOffset(tempDefaultOffset);
        setSnowflakeId("");
        setCommand(null);

        // Reset Tag Creator form
        setTagText("");
        setChapterName("");
        setGroupName("");
        setTagType("normal");
        setActiveTab(0);
    };

    const handleCreateTag = () => {
        // Validation handled by button state, but good to keep safe check
        if (tagType !== "chapter" && !tagText.trim()) return;
        if (tagType === "chapter" && (!chapterName.trim() || existingChapters.includes(chapterName.trim()))) return;

        // Calculate timestamp in HH:MM:SS format relative to start
        const relativeSeconds = Math.max(0, tagPopupTimestamp - startTime);
        const timestamp = secondsToTime(relativeSeconds);
        const birthdayText = wsKey === "doki" ? "Dragoon Birthdays" : "Birthdays!";

        const newRows = [];
        const newControls = {};
        const generateId = (prefix) => `${prefix}-${Date.now()}-creator`;

        if (tagType === "chapter") {
            const cName = chapterName.trim();
            // Header
            newRows.push({
                id: generateId("chap-header"),
                type: "header",
                subtype: "chapter",
                name: cName,
                originalName: cName,
                timestamp: timestamp,
                isEnabled: true,
            });
            newControls[cName] = { isEnabled: true, type: "chapter" };

            // Tag (Only if text is provided)
            if (tagText.trim()) {
                newRows.push({
                    id: generateId("tag"),
                    type: "tag",
                    subtype: "chapter",
                    parentName: cName,
                    timestamp: timestamp,
                    text: tagText,
                    originalText: tagText,
                    isEnabled: true,
                    isEditing: false,
                });
            }
        } else if (tagType === "collection") {
            const gName = groupName.trim() || "Group";
            // Check if group exists to determine if we need header (mergeTags will handle, but we need to provide it if new)
            // mergeTags says: "If currentRows has header... use it". "If newRows has header... use it".
            // We should provide header just in case.
            newRows.push({
                id: generateId("col-header"),
                type: "header",
                subtype: "collection",
                name: gName,
                originalName: gName,
                timestamp: timestamp, // collection timestamp usually first tag?
                isEnabled: true,
            });
            newControls[gName] = { isEnabled: true, type: "collection", order: 999 }; // mergeTags fixes order
            // Tag
            newRows.push({
                id: generateId("tag"),
                type: "tag",
                subtype: "collection",
                parentName: gName,
                timestamp: timestamp,
                text: tagText,
                originalText: tagText,
                isEnabled: true,
                isEditing: false,
            });
        } else {
            // Normal
            newRows.push({
                id: generateId("tag"),
                type: "tag",
                subtype: "normal",
                timestamp: timestamp,
                text: tagText,
                originalText: tagText,
                isEnabled: true,
                isEditing: false,
                isError: false, // Ensure no error state initially
            });
        }

        const { rows, controls: updatedControls } = mergeTags(
            formattedRows,
            controls,
            newRows,
            newControls,
            birthdayText,
        );
        setFormattedRows(rows);
        setControls(updatedControls);
        handleClose();
    };

    const hasFormattedTags = formattedRows && formattedRows.length > 0;

    // existing groups for autocomplete
    const existingGroups = Object.keys(controls).filter((k) => controls[k].type === "collection");
    // existing chapters
    const existingChapters = formattedRows
        .filter((r) => r.type === "header" && r.subtype === "chapter")
        .map((r) => r.name);

    // Validation for Button
    const isChapterNameUnique = !existingChapters.includes(chapterName.trim());
    const isCreateDisabled = tagType === "chapter" ? !chapterName.trim() || !isChapterNameUnique : !tagText.trim();

    return (
        <Dialog open={tagPopupOpen} onClose={handleClose} maxWidth="sm" fullWidth>
            {hasFormattedTags ? (
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
                        <Tab label="Check Offset" />
                        <Tab label="Create Tag" />
                    </Tabs>
                </Box>
            ) : (
                <DialogTitle>Tag Offset Calculator</DialogTitle>
            )}

            <DialogContent sx={{ pt: 2 }}>
                <Paper elevation={6} sx={{ padding: 1.3, mb: 2 }}>
                    <Typography>
                        [{formattedTimestamp}] {tagPopupText}
                    </Typography>
                </Paper>

                {activeTab === 0 && (
                    <>
                        {!hasFormattedTags && (
                            <Typography variant="h6" gutterBottom>
                                Offset Calculator
                            </Typography>
                        )}
                        <Typography paddingTop={1}>Enter the Message ID of the tag you want to offset.</Typography>
                        <TextField
                            label="Message ID"
                            type="text"
                            value={snowflakeId}
                            onChange={handleSnowflakeIdChange}
                            fullWidth
                            margin="normal"
                            size="small"
                        />
                        <Typography>Enter the taggerbot default offset.</Typography>
                        <TextField
                            label="Default Offset"
                            type="text"
                            value={tempDefaultOffset}
                            onChange={handleDefaultOffsetChange}
                            fullWidth
                            margin="normal"
                            size="small"
                        />
                        {command !== null && (
                            <Typography
                                variant="body1"
                                marginTop="16px"
                                sx={{ bgcolor: "action.hover", p: 1, borderRadius: 1 }}
                            >
                                <span style={{ fontFamily: "monospace" }}>{command}</span>
                            </Typography>
                        )}
                    </>
                )}

                {activeTab === 1 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <TextField
                            label={tagType === "chapter" ? "Tag Text (Optional)" : "Tag Text"}
                            value={tagText}
                            onChange={(e) => setTagText(e.target.value)}
                            fullWidth
                            autoFocus
                        />

                        <FormControl>
                            <FormLabel>Tag Type</FormLabel>
                            <RadioGroup row value={tagType} onChange={(e) => setTagType(e.target.value)}>
                                <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                                <FormControlLabel value="chapter" control={<Radio />} label="Chapter" />
                                <FormControlLabel value="collection" control={<Radio />} label="Group" />
                            </RadioGroup>
                        </FormControl>

                        {tagType === "chapter" && (
                            <Autocomplete
                                freeSolo
                                options={existingChapters}
                                value={chapterName}
                                onInputChange={(e, v) => setChapterName(v)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Chapter Name"
                                        error={!isChapterNameUnique && !!chapterName}
                                        helperText={
                                            !isChapterNameUnique && !!chapterName ? "Chapter name already exists" : ""
                                        }
                                    />
                                )}
                            />
                        )}

                        {tagType === "collection" && (
                            <Autocomplete
                                freeSolo
                                options={existingGroups}
                                value={groupName}
                                onInputChange={(e, v) => setGroupName(v)}
                                renderInput={(params) => <TextField {...params} label="Group Name" />}
                            />
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
                {activeTab === 0 ? (
                    <>
                        <Button onClick={handleCopyToClipboard} color="primary" disabled={command === null}>
                            Copy Command
                        </Button>
                        <Button onClick={handleClose} color="primary">
                            Close
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={handleClose} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTag}
                            variant="contained"
                            color="primary"
                            disabled={isCreateDisabled}
                        >
                            Create Tag
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default TagOffsetPopup;
