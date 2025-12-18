import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Paper } from "@mui/material";
import { useState } from "react";
import { calculateOffset, offsetToCommand, snowflakeToUnix } from "../logic/timestamp";
import { unixToRelative } from "../logic/dateTime";
import { useAppStore } from "../store/store";

/**
 * A dialog for calculating the offset of a transcript tag relative to a Discord message ID.
 */
const TagOffsetPopup = () => {
    const tagPopupOpen = useAppStore((state) => state.tagPopupOpen);
    const setTagPopupOpen = useAppStore((state) => state.setTagPopupOpen);
    const tagPopupTimestamp = useAppStore((state) => state.tagPopupTimestamp);
    const tagPopupText = useAppStore((state) => state.tagPopupText);
    const defaultOffset = useAppStore((state) => state.defaultOffset);
    const setDefaultOffset = useAppStore((state) => state.setDefaultOffset);
    const startTime = useAppStore((state) => state.startTime);

    const [tempDefaultOffset, setTempDefaultOffset] = useState(defaultOffset);
    const [snowflakeId, setSnowflakeId] = useState("");
    const [command, setCommand] = useState(null);
    const formattedTimestamp = unixToRelative(tagPopupTimestamp, startTime);

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
    };

    return (
        <Dialog open={tagPopupOpen} onClose={handleClose}>
            <DialogTitle>Tag Offset Calculator</DialogTitle>
            <DialogContent>
                <Paper elevation={6} sx={{ padding: 1.3 }}>
                    <Typography>
                        [{formattedTimestamp}] {tagPopupText}
                    </Typography>
                </Paper>
                <Typography paddingTop={2}>Enter the Message ID of the tag you want to offset.</Typography>
                <TextField
                    label="Message ID"
                    type="text"
                    value={snowflakeId}
                    onChange={handleSnowflakeIdChange}
                    fullWidth
                    margin="normal"
                />
                <Typography>Enter the taggerbot default offset.</Typography>
                <TextField
                    label="Default Offset"
                    type="text"
                    value={tempDefaultOffset}
                    onChange={handleDefaultOffsetChange}
                    fullWidth
                    margin="normal"
                />
                {command !== null && (
                    <>
                        <Typography variant="body1" marginTop="16px">
                            <span style={{ fontFamily: "monospace" }}>{command}</span>
                        </Typography>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between" }}>
                <Button onClick={handleCopyToClipboard} color="primary" disabled={command === null}>
                    Copy Command
                </Button>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TagOffsetPopup;
