import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField } from "@mui/material";
import { useContext, useState } from "react";
import { ClipperPopupContext } from "../providers/ClipperPopupProvider";
import { TranscriptContext } from "../providers/TranscriptProvider";
import { server } from "../config";

const ClipperPopup = ({ wsKey }) => {
    const { clipPopupOpen, clipStartIndex, clipEndIndex, setClipPopupOpen, setClipStartIndex, setClipEndIndex } =
        useContext(ClipperPopupContext);
    const { mediaType } = useContext(TranscriptContext);
    const [clipName, setClipName] = useState("");

    const hasAudio = mediaType === "audio" || mediaType === "video";
    const hasVideo = mediaType === "video";

    const handleDownloadMp3 = () => {
        const start = Math.min(clipStartIndex, clipEndIndex);
        const end = Math.max(clipStartIndex, clipEndIndex);
        const downloadUrl = `${server}/${wsKey}/clip?start=${start}&end=${end}&name=${clipName}&type=mp3`;
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
                    This will download a clip containing (and including) the {1 + clipEndIndex - clipStartIndex}{" "}
                    selected lines.
                </Typography>
                <Typography>Enter the name of the clip:</Typography>
                <TextField
                    label="Clip Name"
                    type="text"
                    value={clipName}
                    inputRef={(input) => input && input.focus()}
                    onChange={handleNameChange}
                    onKeyDown={(e) => {
                        e.key === "Enter" && handleDownloadMp3();
                    }}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between" }}>
                {hasAudio && (
                    <Button onClick={handleDownloadMp3} color="primary">
                        Download mp3
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
