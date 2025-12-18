import { Menu, MenuItem } from "@mui/material";
import { unixToRelative } from "../logic/dateTime";
import { maxClipSize, server } from "../config";
import { useAppStore } from "../store/store";

/**
 * A context menu for a specific line in the transcript.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 * @param {function(number): void} props.jumpToLine - Callback to scroll to a specific line id.
 */
export default function LineMenu({ wsKey, jumpToLine }) {
    const lineMenuId = useAppStore((state) => state.lineMenuId);
    const activeId = useAppStore((state) => state.activeId);
    const transcript = useAppStore((state) => state.transcript);
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);
    const setLineMenuId = useAppStore((state) => state.setLineMenuId);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);

    const lineAnchorEl = document.getElementById(`line-button-${lineMenuId}`);
    const open = lineMenuId > -1 ? Boolean(lineAnchorEl) : false;

    const downloadUrl = `${server}/${wsKey}/audio?id=${lineMenuId}`;

    const selectedLine = transcript.filter((line) => line.id === lineMenuId)[0];
    const ts = selectedLine?.timestamp;
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
        setLineMenuId(-1);
    };
    const handleJumpToLine = () => {
        jumpToLine(lineMenuId);
        setLineMenuId(-1);
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
            anchorEl={lineAnchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={anchorOrigin}
            transformOrigin={transformOrigin}
        >
            <MenuItem disabled>id: {lineMenuId > -1 ? lineMenuId : ""}</MenuItem>
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
