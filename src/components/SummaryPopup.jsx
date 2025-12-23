import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Tabs, Tab, Box, Autocomplete, Paper } from "@mui/material";
import { useState, useEffect } from "react";
import { unixToRelative } from "../logic/dateTime";
import { useAppStore } from "../store/store";
import { loadSummary, saveSummary } from "../logic/summary";

const SummaryPopup = () => {
    const summaryPopupOpen = useAppStore((state) => state.summaryPopupOpen);
    const setSummaryPopupOpen = useAppStore((state) => state.setSummaryPopupOpen);
    const summaryPopupTimestamp = useAppStore((state) => state.summaryPopupTimestamp);
    const summaryPopupText = useAppStore((state) => state.summaryPopupText);
    const startTime = useAppStore((state) => state.startTime);
    // Use wsKey (channel ID) to namespace storage. 
    const wsKey = useAppStore((state) => state.activeId) || "default";

    const [tabValue, setTabValue] = useState(0);
    const [tagText, setTagText] = useState("");
    const [chapterTitle, setChapterTitle] = useState("");
    const [groupName, setGroupName] = useState("");
    const [existingGroups, setExistingGroups] = useState([]);

    const formattedTimestamp = unixToRelative(summaryPopupTimestamp, startTime);

    useEffect(() => {
        if (summaryPopupOpen) {
            setTagText("");
            setChapterTitle("");
            // Initial load of groups for autocomplete
            const summary = loadSummary(wsKey);
            setExistingGroups(Object.keys(summary.groups || {}));
        }
    }, [summaryPopupOpen, summaryPopupText, wsKey]);

    const handleClose = () => {
        setSummaryPopupOpen(false);
    };

    const handleSave = () => {
        const summary = loadSummary(wsKey);

        if (tabValue === 0) {
            // Tag
            if (!summary.tags) summary.tags = [];
            summary.tags.push({ timestamp: summaryPopupTimestamp, text: tagText });
        } else if (tabValue === 1) {
            // Chapter
            if (!summary.chapters) summary.chapters = [];
            summary.chapters.push({ timestamp: summaryPopupTimestamp, title: chapterTitle, text: tagText });
        } else if (tabValue === 2) {
            // Group
            if (!summary.groups) summary.groups = {};
            if (!summary.groups[groupName]) summary.groups[groupName] = [];
            summary.groups[groupName].push({ timestamp: summaryPopupTimestamp, text: tagText });
        }

        saveSummary(wsKey, summary);
        handleClose();
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Dialog open={summaryPopupOpen} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add to Summary</DialogTitle>
            <DialogContent>
                <Paper elevation={6} sx={{ padding: 1.3, marginBottom: 2 }}>
                    <Typography>
                        [{formattedTimestamp}] {summaryPopupText}
                    </Typography>
                </Paper>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ marginBottom: 2 }}>
                    <Tab label="Tag" />
                    <Tab label="Chapter" />
                    <Tab label="Group" />
                </Tabs>

                {tabValue === 0 && (
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Tag Text"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        value={tagText}
                        onChange={(e) => setTagText(e.target.value)}
                    />
                )}

                {tabValue === 1 && (
                    <>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Chapter Title"
                            type="text"
                            fullWidth
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            sx={{ marginBottom: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="First Tag Text"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            value={tagText}
                            onChange={(e) => setTagText(e.target.value)}
                            helperText="This text will be the start of the chapter content."
                        />
                    </>
                )}

                {tabValue === 2 && (
                    <>
                        <Autocomplete
                            freeSolo
                            options={existingGroups}
                            value={groupName}
                            onInputChange={(event, newInputValue) => {
                                setGroupName(newInputValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    margin="dense"
                                    label="Group Name"
                                    type="text"
                                    fullWidth
                                    autoFocus
                                />
                            )}
                            sx={{ marginBottom: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Tag Text"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            value={tagText}
                            onChange={(e) => setTagText(e.target.value)}
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SummaryPopup;
