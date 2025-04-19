import { useContext } from "react";
import { LineMenuContext } from "../providers/LineMenuProvider";
import { Menu, MenuItem } from "@mui/material";
import { TranscriptContext } from "../providers/TranscriptProvider";
import { unixToRelative } from "../logic/dateTime";
import { AudioContext } from "../providers/AudioProvider";
import { ClipperPopupContext } from "../providers/ClipperPopupProvider";
import { server } from "../config";

export default function LineMenu({ wsKey, jumpToLine }) {
    const { anchorEl, lineMenuId, setAnchorEl, setLineMenuId } = useContext(LineMenuContext);
    const { activeId, transcript, startTime, mediaType } = useContext(TranscriptContext);
    const { setAudioId } = useContext(AudioContext);
    const { clipStartIndex, maxClipSize, setClipStartIndex, setClipEndIndex, setClipPopupOpen } =
        useContext(ClipperPopupContext);
    const open = Boolean(anchorEl);

    const downloadUrl = `${server}/${wsKey}/audio?id=${lineMenuId}`;

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
    const handleJumpToLine = () => {
        jumpToLine(lineMenuId);
        setAnchorEl(null);
    };
    const handleStartClip = () => {
        setClipStartIndex(lineMenuId);
        handleClose();
    };
    const handleDownloadClip = () => {
        setClipEndIndex(lineMenuId);
        setClipPopupOpen(true);
        handleClose();
    };
    const handleResetClip = () => {
        setClipStartIndex(-1);
        setClipEndIndex(-1);
        handleClose();
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

    const hasAudio = mediaType === "audio" || mediaType === "video";
    const shouldRenderStartClip = hasAudio && clipStartIndex < 0;
    const shouldRenderDownloadClip =
        hasAudio &&
        !shouldRenderStartClip &&
        lineMenuId !== clipStartIndex &&
        Math.abs(clipStartIndex - lineMenuId) < maxClipSize;
    const shouldRenderResetClip = hasAudio && !shouldRenderStartClip;

    let anchorOrigin = {
        vertical: "bottom",
        horizontal: "left",
    };
    let transformOrigin = {
        vertical: "top",
        horizontal: "left",
    };

    if (clipStartIndex >= 0 && lineMenuId > clipStartIndex) {
        anchorOrigin = {
            vertical: "top",
            horizontal: "left",
        };
        transformOrigin = {
            vertical: "bottom",
            horizontal: "left",
        };
    }

    return (
        <Menu
            id="line-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={anchorOrigin}
            transformOrigin={transformOrigin}
        >
            <MenuItem disabled>id: {lineMenuId}</MenuItem>
            {shouldRenderStartClip && <MenuItem onClick={handleStartClip}>Start Clip</MenuItem>}
            {shouldRenderDownloadClip && <MenuItem onClick={handleDownloadClip}>Process Clip</MenuItem>}
            {shouldRenderResetClip && <MenuItem onClick={handleResetClip}>Reset Clip</MenuItem>}
            {hasAudio && <MenuItem onClick={handleDownload}>Download Audio</MenuItem>}
            {hasAudio && <MenuItem onClick={handlePlay}>Play Audio</MenuItem>}
            <MenuItem onClick={handleOpenStream}>Open Stream</MenuItem>
            <MenuItem onClick={handleCopyTimestamp}>Copy Timestamp</MenuItem>
            <MenuItem onClick={handleJumpToLine}>Jump to line</MenuItem>
        </Menu>
    );
}
