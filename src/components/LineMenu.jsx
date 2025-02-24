import { useContext } from "react";
import { LineMenuContext } from "../providers/LineMenuProvider";
import { Menu, MenuItem } from "@mui/material";
import { SettingContext } from "../providers/SettingProvider";
import { TranscriptContext } from "../providers/TranscriptProvider";
import { unixToRelative } from "../logic/dateTime";
import { AudioContext } from "../providers/AudioProvider";

export default function LineMenu({ wsKey }) {
    const { anchorEl, lineMenuId, setAnchorEl, setLineMenuId } = useContext(LineMenuContext);
    const { activeId, transcript, startTime } = useContext(TranscriptContext);
    const { audioDownloader } = useContext(SettingContext);
    const { setAudioId } = useContext(AudioContext);
    const open = Boolean(anchorEl);

    const downloadUrl = `https://dokiscripts.com/${wsKey}/audio?id=${lineMenuId}`;

    const lines = transcript.filter((line) => line.id === lineMenuId);
    const ts = lines?.[0]?.segments?.[0]?.timestamp;
    const formattedTime = unixToRelative(ts, startTime);

    let openUrl = "";
    if (/^\d+$/.test(activeId)) {
        // twitch
        openUrl = `https://www.twitch.tv/videos/${activeId}?t=${formattedTime}`;
    } else {
        // yt
        openUrl = `https://www.youtube.com/live/${activeId}?t=${formattedTime}`;
    }

    const handleClose = () => {
        setAnchorEl(null);
        setLineMenuId(-1);
    };
    const handleDownload = () => {
        window.open(downloadUrl, "_blank");
        handleClose();
    };
    const handlePlay = () => {
        setAudioId(lineMenuId);
        handleClose();
    };
    const handleOpenStream = () => {
        window.open(openUrl, "_blank");
        handleClose();
    };

    const handleCopyTimestamp = () => {
        navigator.clipboard.writeText(ts);
    };

    return (
        <Menu
            id="line-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
        >
            {audioDownloader && <MenuItem onClick={handleDownload}>Download Audio</MenuItem>}
            {audioDownloader && <MenuItem onClick={handlePlay}>Play Audio</MenuItem>}
            {lines.length > 0 && <MenuItem onClick={handleOpenStream}>Open Stream</MenuItem>}
            {lines.length > 0 && <MenuItem onClick={handleCopyTimestamp}>Copy Timestamp</MenuItem>}
        </Menu>
    );
}
