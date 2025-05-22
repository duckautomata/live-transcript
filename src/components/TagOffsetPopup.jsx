import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Paper } from "@mui/material";
import { useContext, useState } from "react";
import { calculateOffset, offsetToCommand, snowflakeToUnix } from "../logic/timestamp";
import { SettingContext } from "../providers/SettingProvider";
import { unixToRelative } from "../logic/dateTime";
import { TranscriptContext } from "../providers/TranscriptProvider";

const TagOffsetPopup = ({ open, setOpen, timestamp, text }) => {
    const { defaultOffset, setDefaultOffset } = useContext(SettingContext);
    const { startTime } = useContext(TranscriptContext);
    const [tempDefaultOffset, setTempDefaultOffset] = useState(defaultOffset);
    const [snowflakeId, setSnowflakeId] = useState("");
    const [command, setCommand] = useState(null);
    const formattedTimestamp = unixToRelative(timestamp, startTime);

    const handleSnowflakeIdChange = (event) => {
        setSnowflakeId(event.target.value);
        let snowflakeUnix = null;
        let tagOffset = null;
        let tagOffsetCommand = null;
        try {
            snowflakeUnix = snowflakeToUnix(event.target.value);
            tagOffset = calculateOffset(timestamp, snowflakeUnix, tempDefaultOffset);
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
            tagOffset = calculateOffset(timestamp, snowflakeUnix, event.target.value);
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
        setOpen(false);
        setDefaultOffset(tempDefaultOffset);
        setSnowflakeId("");
        setCommand(null);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Tag Offset Calculator</DialogTitle>
            <DialogContent>
                <Paper elevation={6} sx={{ padding: 1.3 }}>
                    <Typography>
                        [{formattedTimestamp}] {text}
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
