import { useEffect, useMemo, useRef, useState } from "react";
import {
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

/**
 * TranscriptFrame component for displaying the transcript as a grid of frames.
 *
 * @param {object} props
 * @param {string} props.mediaBaseUrl
 * @param {TranscriptLine[]} props.displayData
 * @param {string} props.activeId
 * @param {string} props.wsKey
 * @param {Map<string, any[]>} props.tagsMap
 * @param {number} props.startTime
 */
export default function TranscriptFrame({ mediaBaseUrl, displayData, activeId, wsKey, tagsMap, startTime }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    /** @type {[TranscriptLine, (line: TranscriptLine) => void]} */
    const [selectedLine, setSelectedLine] = useState(null);
    const selectedLineRef = useRef(null);
    const [lastSelectedId, setLastSelectedId] = useState(null);
    const virtuosoRef = useRef(null);

    const reversedDisplayData = useMemo(() => {
        return [...displayData].reverse();
    }, [displayData]);

    const activeItemWidth = useMemo(() => {
        if (isMobile) return "50%"; // 2 per row on mobile
        return "200px"; // Fixed width on desktop
    }, [isMobile]);

    /**
     *
     * @param {TranscriptLine} line
     */
    const handleFrameClick = (line) => {
        setSelectedLine(line);
        setLastSelectedId(line.id);
    };

    useEffect(() => {
        selectedLineRef.current = selectedLine;
    }, [selectedLine]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentSelected = selectedLineRef.current;
            if (!currentSelected) return;

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
                    setSelectedLine(nextLine);
                    setLastSelectedId(nextLine.id);
                    virtuosoRef.current?.scrollToIndex({ index: nextIndex, align: "center" });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [reversedDisplayData]);

    const handleClose = () => {
        setSelectedLine(null);
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
                    <Typography>No frames available.</Typography>
                </Box>
            ) : (
                <VirtuosoGrid
                    ref={virtuosoRef}
                    style={{ height: "100%" }}
                    data={reversedDisplayData}
                    components={{
                        List: ListContainer,
                        Item: ({ children, ...props }) => (
                            <ItemContainer {...props} sx={{ width: activeItemWidth }}>
                                {children}
                            </ItemContainer>
                        ),
                    }}
                    itemClassName="frame-item"
                    itemContent={(index, line) => (
                        <FrameItem
                            mediaBaseUrl={mediaBaseUrl}
                            line={line}
                            tagsMap={tagsMap}
                            activeId={activeId}
                            wsKey={wsKey}
                            lastSelectedId={lastSelectedId}
                            onFrameClick={handleFrameClick}
                            startTime={startTime}
                        />
                    )}
                />
            )}

            <Dialog open={!!selectedLine} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogContent>
                    {selectedLine && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box
                                sx={{
                                    width: "100%",
                                    aspectRatio: "16/9",
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
                                        src={getFrameUrl(mediaBaseUrl, wsKey, activeId, selectedLine.fileId)}
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
                                    tagsMap={tagsMap}
                                    startTime={startTime}
                                />
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
