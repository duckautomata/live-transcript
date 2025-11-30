import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField } from "@mui/material";
import { useState } from "react";
import { server } from "../config";
import { useAppStore } from "../store/store";

const ClipperPopup = ({ wsKey }) => {
    const clipPopupOpen = useAppStore((state) => state.clipPopupOpen);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);
    const clipEndIndex = useAppStore((state) => state.clipEndIndex);
    const mediaType = useAppStore((state) => state.mediaType);
    const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const [clipName, setClipName] = useState("");

    const hasAudio = mediaType === "audio" || mediaType === "video";
    const hasVideo = mediaType === "video";

    const handleDownloadM4a = () => {
        const start = Math.min(clipStartIndex, clipEndIndex);
        const end = Math.max(clipStartIndex, clipEndIndex);
        const downloadUrl = `${server}/${wsKey}/clip?start=${start}&end=${end}&name=${clipName}&type=m4a`;
        if (hasAudio) {
            window.open(downloadUrl, "_blank");
        }
        handleReset();
    };

    const handleDownloadMp4 = () => {
        const start = Math.min(clipStartIndex, clipEndIndex);
        const end = Math.max(clipStartIndex, clipEndIndex);
        const downloadUrl = `${server}/${wsKey}/clip?start=${start}&end=${end}&name=${clipName}&type=mp4`;
        if (hasVideo) {
            window.open(downloadUrl, "_blank");
        }
        handleReset();
    };

    const handleNameChange = (event) => {
        setClipName(event.target.value);
    };

    const handleReset = () => {
        setClipStartIndex(-1);
        setClipEndIndex(-1);
        handleClose();
    };

    const handleClose = () => {
        setClipName("");
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
                <Typography>Enter the name of the clip:</Typography>
                <TextField
                    label="Clip Name"
                    type="text"
                    value={clipName}
                    inputRef={(input) => input && input.focus()}
                    onChange={handleNameChange}
                    onKeyDown={(e) => {
                        e.key === "Enter" && handleDownloadM4a();
                    }}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between" }}>
                {hasAudio && (
                    <Button onClick={handleDownloadM4a} color="primary">
                        Download Audio
                    </Button>
                )}
                {hasVideo && (
                    <Button onClick={handleDownloadMp4} color="primary">
                        Download mp4
                    </Button>
                )}
                <Button onClick={handleReset} color="primary">
                    Reset Clip
                </Button>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClipperPopup;
