import { useRef } from "react";
import { Menu, MenuItem } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { unixToRelative } from "../logic/dateTime";
import { maxClipSize } from "../config";
import { useAppStore } from "../store/store";
import {
    selectActiveMediaType,
    selectActiveStartTime,
    selectActiveStreamId,
    selectActiveTranscript,
} from "../store/selectors";
import { downloadAudioUrl } from "../logic/mediaUrls";
import { STREAM_PARAM, lineHash, streamUrl, toAbsoluteUrl } from "../logic/links";
import { copyWithToast } from "../logic/clipboard";

/** Stable empty list so a closed menu never re-renders when transcript lines arrive. */
const EMPTY_TRANSCRIPT = [];

/**
 * A context menu for a specific line in the transcript.
 * Navigation entries are real links so they can be middle-clicked or copied.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 * @param {function(number): void} props.jumpToLine - Callback to scroll to a specific line id.
 * @param {string} props.linkBase - Path (+ search) the line link is built on ("/doki/?stream=x").
 */
export default function LineMenu({ wsKey, jumpToLine, linkBase }) {
    const lineMenuId = useAppStore((state) => state.lineMenuId);
    const isRequested = lineMenuId > -1;

    // Only subscribe to the (large) transcript while a menu is actually open.
    const activeTranscript = useAppStore((state) => (isRequested ? selectActiveTranscript(state) : EMPTY_TRANSCRIPT));
    const selectedId = useAppStore(selectActiveStreamId);
    const activeStartTime = useAppStore(selectActiveStartTime);
    const mediaType = useAppStore(selectActiveMediaType);
    const mediaBaseUrl = useAppStore((state) => state.mediaBaseUrl);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);
    const setLineMenuId = useAppStore((state) => state.setLineMenuId);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);

    const lineAnchorEl = isRequested ? document.getElementById(`line-button-${lineMenuId}`) : null;
    const open = Boolean(lineAnchorEl);

    /**
     * The entries stay mounted through the menu's closing transition, so they must keep rendering the line
     * they were opened for. Re-rendering them for "no line" would strip the `href` off the link entries
     * while the browser is still acting on the click that closed the menu, cancelling the navigation.
     */
    const lastOpenRef = useRef({ id: -1, line: undefined });
    if (isRequested) {
        lastOpenRef.current = { id: lineMenuId, line: activeTranscript.find((line) => line.id === lineMenuId) };
    }
    const menuId = lastOpenRef.current.id;
    const selectedLine = lastOpenRef.current.line;
    const ts = selectedLine?.timestamp;
    const downloadUrl = downloadAudioUrl(mediaBaseUrl, wsKey, selectedId, selectedLine?.fileId, menuId);
    // Only a real offset into the stream makes a usable `?t=`; otherwise the link opens the stream itself.
    const relativeTime = ts && activeStartTime && ts > activeStartTime ? unixToRelative(ts, activeStartTime) : "";
    const openUrl = streamUrl(selectedId, relativeTime);
    const linePath = `${linkBase ?? ""}${lineHash(menuId)}`;

    /**
     * The copied link always names the stream, so it still opens on the right line once this stream has
     * ended and moved to the past-streams list. (The address bar itself stays clean while live.)
     */
    const buildShareableLinePath = () => {
        const [pathname, search = ""] = (linkBase ?? "").split("?");
        const params = new URLSearchParams(search);
        if (selectedId && !params.has(STREAM_PARAM)) {
            params.set(STREAM_PARAM, selectedId);
        }
        const query = params.toString();
        return `${pathname}${query ? `?${query}` : ""}${lineHash(menuId)}`;
    };

    const handleClose = () => {
        setLineMenuId(-1);
    };
    const handleJumpToLine = () => {
        jumpToLine(menuId);
        setLineMenuId(-1);
    };
    const handleStartClip = () => {
        setClipStartIndex(menuId);
        handleClose();
    };
    const handleClipLine = () => {
        setClipStartIndex(menuId);
        setClipEndIndex(menuId);
        setClipPopupOpen(true);
        handleClose();
    };
    const handleDownloadClip = () => {
        setClipEndIndex(menuId);
        setClipPopupOpen(true);
        handleClose();
    };
    const handleResetClip = () => {
        setClipStartIndex(-1);
        setClipEndIndex(-1);
        handleClose();
    };
    const handlePlay = () => {
        setAudioId(menuId);
        handleClose();
    };

    const handleCopyTimestamp = () => {
        copyWithToast(String(ts ?? ""), "Timestamp copied");
        handleClose();
    };

    const handleCopyLineLink = () => {
        copyWithToast(toAbsoluteUrl(buildShareableLinePath()), "Line link copied");
        handleClose();
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

    const currentLineMediaAvailable = isRequested ? isMediaAvailable(menuId) : true;

    const shouldRenderStartClip = hasAudio && clipStartIndex < 0 && currentLineMediaAvailable;

    const shouldRenderDownloadClip =
        hasAudio &&
        !shouldRenderStartClip &&
        Math.abs(clipStartIndex - menuId) < maxClipSize &&
        isRangeMediaAvailable(clipStartIndex, menuId);

    const shouldRenderResetClip = hasAudio && !shouldRenderStartClip;

    let anchorOrigin = {
        vertical: "bottom",
        horizontal: "left",
    };
    let transformOrigin = {
        vertical: "top",
        horizontal: "left",
    };

    if (clipStartIndex >= 0 && menuId < clipStartIndex) {
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
            <MenuItem disabled>id: {menuId > -1 ? menuId : ""}</MenuItem>
            {shouldRenderStartClip && <MenuItem onClick={handleClipLine}>Clip this line</MenuItem>}
            {shouldRenderStartClip && <MenuItem onClick={handleStartClip}>Start Clip</MenuItem>}
            {shouldRenderDownloadClip && <MenuItem onClick={handleDownloadClip}>Process Clip</MenuItem>}
            {shouldRenderResetClip && <MenuItem onClick={handleResetClip}>Reset Clip</MenuItem>}
            {hasAudio && (
                <MenuItem
                    component="a"
                    href={downloadUrl}
                    onClick={handleClose}
                    disabled={!downloadUrl || !currentLineMediaAvailable}
                    data-testid="line-menu-download"
                >
                    Download Audio
                </MenuItem>
            )}
            {hasAudio && (
                <MenuItem onClick={handlePlay} disabled={!currentLineMediaAvailable}>
                    Play Audio
                </MenuItem>
            )}
            <MenuItem
                component="a"
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                disabled={!selectedId || !ts}
                data-testid="line-menu-open-stream"
            >
                Open Stream
            </MenuItem>
            <MenuItem onClick={handleCopyTimestamp}>Copy Timestamp</MenuItem>
            <MenuItem onClick={handleCopyLineLink} data-testid="line-menu-copy-link">
                Copy line link
            </MenuItem>
            <MenuItem
                component={RouterLink}
                to={linePath}
                replace
                onClick={handleJumpToLine}
                data-testid="line-menu-jump"
            >
                Jump to line
            </MenuItem>
        </Menu>
    );
}
