import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
} from "@mui/material";
import { useState } from "react";
import { server } from "../config";
import { useAppStore } from "../store/store";

/**
 * A popup dialog for configuring and downloading media clips.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
const ClipperPopup = ({ wsKey }) => {
    const clipPopupOpen = useAppStore((state) => state.clipPopupOpen);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);
    const clipEndIndex = useAppStore((state) => state.clipEndIndex);
    const mediaType = useAppStore((state) => state.mediaType);
    const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);

    const [clipName, setClipName] = useState("");
    const [fileFormat, setFileFormat] = useState("");
    const [formatError, setFormatError] = useState(false);

    const hasVideo = mediaType === "video";

    const handleDownload = () => {
        if (fileFormat === "") {
            setFormatError(true);
            return;
        }

        const start = Math.min(clipStartIndex, clipEndIndex);
        const end = Math.max(clipStartIndex, clipEndIndex);

        const downloadUrl = `${server}/${wsKey}/clip?start=${start}&end=${end}&name=${clipName}&type=${fileFormat}`;

        window.open(downloadUrl, "_blank");
        handleReset();
    };

    const handleNameChange = (event) => {
        setClipName(event.target.value);
    };

    const handleFormatChange = (event) => {
        setFileFormat(event.target.value);
        if (event.target.value !== "") {
            setFormatError(false);
        }
    };

    const handleReset = () => {
        setClipStartIndex(-1);
        setClipEndIndex(-1);
        handleClose();
    };

    const handleClose = () => {
        setClipName("");
        setFileFormat("");
        setFormatError(false);
        setClipEndIndex(-1);
        setClipPopupOpen(false);
    };

    return (
        <Dialog open={clipPopupOpen} onClose={handleClose}>
            <DialogTitle>Clip Downloader</DialogTitle>
            <DialogContent>
                <Typography>
                    This will download a clip containing (and including) the{" "}
                    {1 + Math.abs(clipEndIndex - clipStartIndex)} selected lines.
                </Typography>

                <TextField
                    label="Clip Name"
                    type="text"
                    value={clipName}
                    inputRef={(input) => input && input.focus()}
                    onChange={handleNameChange}
                    onKeyDown={(e) => {
                        e.key === "Enter" && handleDownload();
                    }}
                    fullWidth
                    margin="normal"
                />

                <FormControl fullWidth margin="normal" error={formatError}>
                    <InputLabel id="format-select-label" shrink>
                        File Format
                    </InputLabel>
                    <Select
                        labelId="format-select-label"
                        value={fileFormat}
                        onChange={handleFormatChange}
                        displayEmpty
                        label="File Format"
                    >
                        <MenuItem value="" disabled>
                            Select Download Format
                        </MenuItem>
                        <MenuItem value="mp3">MP3 (Audio)</MenuItem>
                        <MenuItem value="m4a">M4A (Audio)</MenuItem>
                        <MenuItem value="mp4" disabled={!hasVideo}>
                            MP4 (Multimedia)
                        </MenuItem>
                    </Select>
                    {formatError && <FormHelperText>Please select a file format</FormHelperText>}
                </FormControl>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button onClick={handleReset} color="primary">
                        Reset Clip
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </div>
                <Button onClick={handleDownload} variant="contained" color="primary">
                    Download
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClipperPopup;
