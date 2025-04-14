import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField } from "@mui/material";
import { useContext, useState } from "react";
import { ClipperPopupContext } from "../providers/ClipperPopupProvider";

const ClipperPopup = ({ wsKey }) => {
    const { clipPopupOpen, clipStartIndex, clipEndIndex, setClipPopupOpen, setClipStartIndex, setClipEndIndex } =
        useContext(ClipperPopupContext);
    const [clipName, setClipName] = useState("");

    const handleDownload = () => {
        const start = Math.min(clipStartIndex, clipEndIndex);
        const end = Math.max(clipStartIndex, clipEndIndex);
        const downloadUrl = `https://dokiscripts.com/${wsKey}/clip?start=${start}&end=${end}&name=${clipName}`;
        window.open(downloadUrl, "_blank");
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
            <DialogTitle>Clip Saver</DialogTitle>
            <DialogContent>
                <Typography>
                    This will download an audio clip between (and including) the ids [{clipStartIndex}, {clipEndIndex}
                    ].
                </Typography>
                <Typography>Enter the name of the clip:</Typography>
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
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between" }}>
                <Button onClick={handleDownload} color="primary">
                    Download mp3
                </Button>
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
