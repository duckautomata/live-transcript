import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Paper,
    Typography,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Dialog,
    DialogContent,
} from "@mui/material";

import { VirtuosoGrid } from "react-virtuoso";
import styled from "@emotion/styled";
import Line from "./Line";
import FrameItem from "./FrameItem";
import FrameImage from "./FrameImage";
import { getFrameUrl } from "../../logic/mediaUrls";
import { useAppStore } from "../../store/store";

/**
 * @typedef {import('../../store/types').TranscriptLine} TranscriptLine
 */

const ItemContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0.5),
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
}));

const ListContainer = styled(Box)(() => ({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
}));

// Virtuoso treats a new component *type* as a different component and remounts every tile (and its
// image), so the grid components live at module scope and read the tile width from `context`.
// Both strip `context` so it never lands on the DOM as an attribute.
const GridItem = forwardRef(function GridItem({ children, context, ...props }, ref) {
    return (
        <ItemContainer ref={ref} {...props} sx={{ width: context.itemWidth }}>
            {children}
        </ItemContainer>
    );
});

// oxlint-disable-next-line no-unused-vars
const GridList = forwardRef(function GridList({ context, ...props }, ref) {
    return <ListContainer ref={ref} {...props} />;
});

const GRID_COMPONENTS = { List: GridList, Item: GridItem };

// Frames are 16/9 until a real one has been measured, so the grid does not reflow on first paint for
// the common case.
const DEFAULT_ASPECT_RATIO = 16 / 9;
// The longest side of a desktop tile. Widescreen tiles are 200x113, vertical ones 113x200, so a
// column of either takes about the same room.
const TILE_MAX_PX = 200;

/**
 * TranscriptFrame component for displaying the transcript as a grid of frames.
 *
 * @param {object} props
 * @param {string} props.mediaBaseUrl
 * @param {TranscriptLine[]} props.displayData
 * @param {string} props.streamId
 * @param {string} props.wsKey
 * @param {Map<number, Record<number, any[]>>} props.tagsMap - Tag rows per line id (per segment index).
 * @param {number} props.startTime
 * @param {string} props.searchTerm - Normalized search term ("" when not filtering).
 * @param {string} props.linkBase - Path (+ search) line links are built on.
 * @param {function(MouseEvent, number): void} [props.onLineLinkClick] - Click handler for a line's timestamp link.
 */
export default function TranscriptFrame({
    mediaBaseUrl,
    displayData,
    streamId,
    wsKey,
    tagsMap,
    startTime,
    searchTerm,
    linkBase,
    onLineLinkClick,
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Only the id is kept, so the dialog always shows the line's current data (e.g. media that arrived
    // after the tile was opened).
    const [selectedId, setSelectedId] = useState(null);
    const [lastSelectedId, setLastSelectedId] = useState(null);
    const virtuosoRef = useRef(null);

    const reversedDisplayData = useMemo(() => {
        return [...displayData].reverse();
    }, [displayData]);

    const selectedLine = useMemo(
        () => (selectedId === null ? null : (displayData.find((line) => line.id === selectedId) ?? null)),
        [displayData, selectedId],
    );
    const selectedLineRef = useRef(null);
    selectedLineRef.current = selectedLine;

    // Every frame of a stream comes from the same video, so one measured frame sizes the whole grid.
    // The component is keyed by stream, so this resets when a different stream is opened.
    const [measuredRatio, setMeasuredRatio] = useState(null);

    const probeUrl = useMemo(() => {
        const line = reversedDisplayData.find((l) => l.mediaAvailable);
        return line ? getFrameUrl(mediaBaseUrl, wsKey, streamId, line.fileId) : undefined;
    }, [reversedDisplayData, mediaBaseUrl, wsKey, streamId]);

    useEffect(() => {
        if (measuredRatio !== null || !probeUrl) return;

        let cancelled = false;
        const img = new Image();
        img.onload = () => {
            if (!cancelled && img.naturalWidth > 0 && img.naturalHeight > 0) {
                setMeasuredRatio(img.naturalWidth / img.naturalHeight);
            }
        };
        img.src = probeUrl;

        return () => {
            cancelled = true;
            img.onload = null;
        };
    }, [probeUrl, measuredRatio]);

    const aspectRatio = measuredRatio ?? DEFAULT_ASPECT_RATIO;
    const isVertical = aspectRatio < 1;

    const gridContext = useMemo(() => {
        if (isMobile) {
            // Vertical tiles are much taller than they are wide, so fit more of them per row.
            return { itemWidth: isVertical ? "33.3333%" : "50%" };
        }
        const width = isVertical ? Math.round(TILE_MAX_PX * aspectRatio) : TILE_MAX_PX;
        return { itemWidth: `${width}px` };
    }, [isMobile, isVertical, aspectRatio]);

    const handleFrameClick = useCallback((/** @type {TranscriptLine} */ line) => {
        setSelectedId(line.id);
        setLastSelectedId(line.id);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentSelected = selectedLineRef.current;
            if (!currentSelected) return;
            // The line menu opened from the dialog owns the keyboard while it is up.
            if (useAppStore.getState().lineMenuId >= 0) return;

            if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                e.preventDefault();

                const currentIndex = reversedDisplayData.findIndex((l) => l.id === currentSelected.id);
                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                const isShift = e.shiftKey;
                const tenMinutes = 600;

                // Directions
                // ArrowRight -> Newer (Future) -> Index Decreases (since list is Newest First)
                // ArrowLeft -> Older (Past) -> Index Increases
                const isNewer = e.key === "ArrowRight";

                if (isShift) {
                    const targetTime = currentSelected.timestamp + (isNewer ? tenMinutes : -tenMinutes);

                    // Find closest frame to targetTime in the correct direction
                    let closestIdx = currentIndex;
                    let minDiff = Math.abs(reversedDisplayData[currentIndex].timestamp - targetTime);

                    if (isNewer) {
                        // Scan indices < currentIndex (Newer items)
                        for (let i = currentIndex - 1; i >= 0; i--) {
                            const diff = Math.abs(reversedDisplayData[i].timestamp - targetTime);
                            if (diff <= minDiff) {
                                minDiff = diff;
                                closestIdx = i;
                            } else {
                                // Since timestamps are sorted, once diff increases, we are moving away from target
                                break;
                            }
                        }
                    } else {
                        // Scan indices > currentIndex (Older items)
                        for (let i = currentIndex + 1; i < reversedDisplayData.length; i++) {
                            const diff = Math.abs(reversedDisplayData[i].timestamp - targetTime);
                            if (diff <= minDiff) {
                                minDiff = diff;
                                closestIdx = i;
                            } else {
                                break;
                            }
                        }
                    }
                    nextIndex = closestIdx;
                } else {
                    // Single Step
                    if (isNewer) {
                        nextIndex = Math.max(0, currentIndex - 1);
                    } else {
                        nextIndex = Math.min(reversedDisplayData.length - 1, currentIndex + 1);
                    }
                }

                if (nextIndex !== currentIndex) {
                    const nextLine = reversedDisplayData[nextIndex];
                    setSelectedId(nextLine.id);
                    setLastSelectedId(nextLine.id);
                    virtuosoRef.current?.scrollToIndex({ index: nextIndex, align: "center" });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [reversedDisplayData]);

    const handleClose = () => {
        setSelectedId(null);
    };

    return (
        <Box sx={{ flexGrow: 1, height: "100%", minHeight: 0 }}>
            {displayData.length === 0 ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                    }}
                >
                    {searchTerm ? (
                        <Alert severity="info" data-testid="search-no-match" sx={{ maxWidth: 600 }}>
                            No lines match “{searchTerm}”
                        </Alert>
                    ) : (
                        <Typography>No frames available.</Typography>
                    )}
                </Box>
            ) : (
                <VirtuosoGrid
                    ref={virtuosoRef}
                    style={{ height: "100%" }}
                    data={reversedDisplayData}
                    context={gridContext}
                    components={GRID_COMPONENTS}
                    itemClassName="frame-item"
                    itemContent={(index, line) => (
                        <FrameItem
                            mediaBaseUrl={mediaBaseUrl}
                            line={line}
                            lineTags={tagsMap.get(line.id)}
                            streamId={streamId}
                            wsKey={wsKey}
                            isSelected={line.id === lastSelectedId}
                            onFrameClick={handleFrameClick}
                            startTime={startTime}
                            aspectRatio={aspectRatio}
                        />
                    )}
                />
            )}

            <Dialog open={!!selectedLine} onClose={handleClose} maxWidth="md" fullWidth aria-label="Frame details">
                <DialogContent>
                    {selectedLine && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box
                                sx={{
                                    // A vertical frame is capped by height instead of width, so the box
                                    // hugs the image rather than leaving black bars down both sides.
                                    width: isVertical ? `min(100%, calc(70vh * ${aspectRatio}))` : "100%",
                                    maxHeight: "70vh",
                                    mx: "auto",
                                    aspectRatio: String(aspectRatio),
                                    overflow: "hidden",
                                    borderRadius: 1,
                                    bgcolor: "black",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                {selectedLine.mediaAvailable ? (
                                    <FrameImage
                                        src={getFrameUrl(mediaBaseUrl, wsKey, streamId, selectedLine.fileId)}
                                        alt={`Frame ${selectedLine.id}`}
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                ) : (
                                    <CircularProgress color="secondary" />
                                )}
                            </Box>
                            <Paper sx={{ p: 1 }}>
                                <Line
                                    id={selectedLine.id}
                                    lineTimestamp={selectedLine.timestamp}
                                    segments={selectedLine.segments}
                                    mediaAvailable={selectedLine.mediaAvailable}
                                    vodAccurate={selectedLine.vodAccurate}
                                    lineTags={tagsMap.get(selectedLine.id)}
                                    startTime={startTime}
                                    searchTerm={searchTerm}
                                    linkBase={linkBase}
                                    onLinkClick={onLineLinkClick}
                                />
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
