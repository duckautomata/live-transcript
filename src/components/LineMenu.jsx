import { Menu, MenuItem } from "@mui/material";
import { unixToRelative } from "../logic/dateTime";
import { maxClipSize } from "../config";
import { useAppStore } from "../store/store";
import { downloadAudioUrl } from "../logic/mediaUrls";

/**
 * A context menu for a specific line in the transcript.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 * @param {function(number): void} props.jumpToLine - Callback to scroll to a specific line id.
 */
export default function LineMenu({ wsKey, jumpToLine }) {
    const lineMenuId = useAppStore((state) => state.lineMenuId);
    const streamId = useAppStore((state) => state.streamId);
    const pastStreamViewing = useAppStore((state) => state.pastStreamViewing);
    const transcript = useAppStore((state) => state.transcript);
    const pastStreamTranscript = useAppStore((state) => state.pastStreamTranscript);
    const activeTranscript = pastStreamViewing ? pastStreamTranscript : transcript;
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const mediaBaseUrl = useAppStore((state) => state.mediaBaseUrl);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);
    const setLineMenuId = useAppStore((state) => state.setLineMenuId);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);
    const selectedId = pastStreamViewing || streamId;

    const lineAnchorEl = document.getElementById(`line-button-${lineMenuId}`);
    const open = lineMenuId > -1 ? Boolean(lineAnchorEl) : false;
    const selectedLine = activeTranscript.filter((line) => line.id === lineMenuId)[0];
    const ts = selectedLine?.timestamp;
    const formattedTime = unixToRelative(ts, startTime);
    const downloadUrl = downloadAudioUrl(mediaBaseUrl, wsKey, selectedId, selectedLine?.fileId, lineMenuId);

    let openUrl = "";
    if (/^\d+$/.test(selectedId)) {
        // twitch
        openUrl = `https://www.twitch.tv/videos/${selectedId}?t=${formattedTime}`;
    } else {
        // yt
        openUrl = `https://www.youtube.com/live/${selectedId}?t=${formattedTime}`;
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
    const handleClipLine = () => {
        setClipStartIndex(lineMenuId);
        setClipEndIndex(lineMenuId);
        setClipPopupOpen(true);
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
        window.location.href = downloadUrl;
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

    // Media availability check
    const isMediaAvailable = (id) => {
        if (mediaType === "none") return true;
        const line = activeTranscript.find((l) => l.id === id);
        return line?.mediaAvailable !== false;
    };

    const isRangeMediaAvailable = (start, end) => {
        if (mediaType === "none") return true;
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        // Find if ANY line in range has mediaAvailable === false.
        const missingMediaLine = activeTranscript.find((l) => l.id >= min && l.id <= max && l.mediaAvailable === false);
        return !missingMediaLine;
    };

    const currentLineMediaAvailable = isMediaAvailable(lineMenuId);

    const shouldRenderStartClip = hasAudio && clipStartIndex < 0 && currentLineMediaAvailable;

    const shouldRenderDownloadClip =
        hasAudio &&
        !shouldRenderStartClip &&
        Math.abs(clipStartIndex - lineMenuId) < maxClipSize &&
        isRangeMediaAvailable(clipStartIndex, lineMenuId);

    const shouldRenderResetClip = hasAudio && !shouldRenderStartClip;

    let anchorOrigin = {
        vertical: "bottom",
        horizontal: "left",
    };
    let transformOrigin = {
        vertical: "top",
        horizontal: "left",
    };

    if (clipStartIndex >= 0 && lineMenuId < clipStartIndex) {
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
            data-testid="line-menu"
            anchorEl={lineAnchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={anchorOrigin}
            transformOrigin={transformOrigin}
        >
            <MenuItem disabled>id: {lineMenuId > -1 ? lineMenuId : ""}</MenuItem>
            {shouldRenderStartClip && <MenuItem onClick={handleClipLine}>Clip this line</MenuItem>}
            {shouldRenderStartClip && <MenuItem onClick={handleStartClip}>Start Clip</MenuItem>}
            {shouldRenderDownloadClip && <MenuItem onClick={handleDownloadClip}>Process Clip</MenuItem>}
            {shouldRenderResetClip && <MenuItem onClick={handleResetClip}>Reset Clip</MenuItem>}
            {hasAudio && <MenuItem onClick={handleDownload}>Download Audio</MenuItem>}
            {hasAudio && (
                <MenuItem onClick={handlePlay} disabled={!currentLineMediaAvailable}>
                    Play Audio
                </MenuItem>
            )}
            <MenuItem onClick={handleOpenStream}>Open Stream</MenuItem>
            <MenuItem onClick={handleCopyTimestamp}>Copy Timestamp</MenuItem>
            <MenuItem onClick={handleJumpToLine}>Jump to line</MenuItem>
        </Menu>
    );
}
