import { useRef, useState, useEffect } from "react";
import { Box, IconButton, Paper, Divider, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { VerticalAlignTop, VerticalAlignBottom, Pause, PlayArrow, Search } from "@mui/icons-material";
import { Virtuoso } from "react-virtuoso";
import Line from "./Line";
import { LOG_MSG } from "../../logic/debug";

/**
 * TranscriptVirtual component for efficiently rendering the transcript logs.
 * Includes virtualization and floating navigation controls.
 *
 * @param {object} props
 * @param {object[]} props.displayData
 * @param {number} props.transcriptLength
 * @param {string} props.searchTerm
 * @param {function(string)} props.setSearchTerm
 * @param {boolean} props.isLive
 * @param {boolean} props.isOnline
 * @param {number} props.pendingJumpId
 * @param {function(number)} props.setPendingJumpId
 * @param {Map<string, any[]>} props.tagsMap
 * @param {boolean} props.hasOverflow
 * @param {number} props.startTime
 */
export default function TranscriptVirtual({
    displayData,
    transcriptLength,
    searchTerm,
    setSearchTerm,
    isLive,
    isOnline,
    pendingJumpId,
    setPendingJumpId,
    tagsMap,
    startTime,
}) {
    const isMobile = useMediaQuery("(max-width:768px)");
    const virtuosoRef = useRef(null);

    // Calculate initial jump index only on mount
    const [initialJumpIndex] = useState(() => {
        if (pendingJumpId !== -1) {
            return displayData.findIndex((line) => line.id === pendingJumpId);
        }
        return -1;
    });

    const [atLiveEdge, setAtLiveEdge] = useState(initialJumpIndex === -1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });
    const transcriptLengthRef = useRef(transcriptLength);
    const atBottomTimerRef = useRef(null);
    const lastStreamUpdateRef = useRef(0);
    const [highlightedId, setHighlightedId] = useState(-1);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (atBottomTimerRef.current) {
                clearTimeout(atBottomTimerRef.current);
            }
        };
    }, []);

    const scrollToLive = () => {
        if (virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({ index: displayData.length - 1, align: "end", behavior: "auto" });
        }
    };

    useEffect(() => {
        const newLines = transcriptLength - transcriptLengthRef.current;
        transcriptLengthRef.current = transcriptLength;

        if (newLines > 0) {
            lastStreamUpdateRef.current = Date.now();
            if (!atLiveEdge) {
                setUnreadCount((prev) => prev + newLines);
            }
        }
    }, [transcriptLength, atLiveEdge]);

    // Handle Pending Jump
    useEffect(() => {
        if (pendingJumpId !== -1) {
            const index = displayData.findIndex((line) => line.id === pendingJumpId);
            if (index !== -1) {
                // If the ref is available (updates), scroll to it.
                // If we used initialTopMostItemIndex (mount), this is redundant but safe.
                if (virtuosoRef.current) {
                    virtuosoRef.current.scrollToIndex({
                        index,
                        align: "start",
                        behavior: "auto",
                    });
                }

                // Set highlight and clear Pending Jump ID
                // We do this regardless of virtuosoRef because initialTopMostItemIndex might have handled the scroll
                setTimeout(() => {
                    setAtLiveEdge(false);
                    setHighlightedId(pendingJumpId);
                    setPendingJumpId(-1);
                    setTimeout(() => {
                        setHighlightedId(-1);
                    }, 2000);
                }, 100);
            }
        }
    }, [displayData, pendingJumpId, setPendingJumpId]);

    useEffect(() => {
        if (window.perfSyncReceivedAt && displayData.length > 0) {
            const renderCompletedAt = performance.now();
            const delta = renderCompletedAt - window.perfSyncReceivedAt;
            LOG_MSG(`[PERF] Sync -> Full Render: ${delta.toFixed(2)}ms`);
            window.perfSyncReceivedAt = null; // Clear to avoid repeated logs
        }
    }, [displayData]);

    return (
        <Box sx={{ flexGrow: 1, position: "relative", minHeight: 0 }}>
            {displayData.length === 0 ? (
                transcriptLength === 0 ? (
                    <Typography>No transcripts at this time.</Typography>
                ) : (
                    <Typography>Nothing found.</Typography>
                )
            ) : (
                <Virtuoso
                    ref={virtuosoRef}
                    data={displayData}
                    atBottomStateChange={(isAtBottom) => {
                        if (isAtBottom) {
                            if (atBottomTimerRef.current) {
                                clearTimeout(atBottomTimerRef.current);
                                atBottomTimerRef.current = null;
                            }
                            setAtLiveEdge(true);
                            setUnreadCount(0);
                        } else {
                            if (atBottomTimerRef.current) {
                                clearTimeout(atBottomTimerRef.current);
                            }
                            atBottomTimerRef.current = setTimeout(() => {
                                setAtLiveEdge(false);
                            }, 250);
                        }
                    }}
                    itemContent={(index, line) => (
                        <Line
                            key={`streamLogsLine-${line.id}`}
                            id={line.id}
                            lineTimestamp={line.timestamp}
                            segments={line.segments}
                            highlight={highlightedId === line.id}
                            mediaAvailable={line.mediaAvailable}
                            tagsMap={tagsMap}
                            startTime={startTime}
                        />
                    )}
                    followOutput={atLiveEdge ? "auto" : false}
                    initialTopMostItemIndex={initialJumpIndex !== -1 ? initialJumpIndex : displayData.length - 1}
                    style={{ height: "100%" }}
                    components={{
                        Footer: () => <Box sx={{ height: 50 }} />,
                    }}
                    defaultItemHeight={30}
                    rangeChanged={(range) => {
                        const dist = displayData.length - 1 - range.endIndex;
                        setVisibleRange(range);

                        // Safety check: specific case where user scrolls up quickly while logs are streaming.
                        if (atLiveEdge && dist > 4) {
                            setAtLiveEdge(false);
                        }
                    }}
                />
            )}

            <Box
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "center",
                    p: 1,
                    zIndex: 10,
                    pointerEvents: "none", // Let clicks pass through empty areas
                }}
            >
                <Paper
                    elevation={4}
                    data-testid="transcript-virtual-toolbar"
                    sx={{
                        pointerEvents: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        padding: "4px 12px",
                        borderRadius: "24px",
                        backgroundColor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Tooltip title="Jump to Top">
                        <IconButton
                            size="small"
                            data-testid="transcript-jumpToTop"
                            onClick={() => {
                                setAtLiveEdge(false);
                                virtuosoRef.current?.scrollToIndex({
                                    index: 0,
                                    align: "start",
                                    behavior: "auto",
                                });
                            }}
                        >
                            <VerticalAlignTop fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ height: 20, my: "auto" }} />

                    {!isMobile && (
                        <>
                            <Typography
                                variant="caption"
                                sx={{ minWidth: 60, textAlign: "center", fontFamily: "monospace" }}
                            >
                                {searchTerm
                                    ? `${displayData.length} / ${transcriptLength} found`
                                    : !atLiveEdge && visibleRange.endIndex < transcriptLength - 1
                                      ? `${visibleRange.startIndex + 1}-${visibleRange.endIndex + 1} / ${transcriptLength}`
                                      : `${transcriptLength} lines`}
                            </Typography>

                            <Divider orientation="vertical" flexItem sx={{ height: 20, my: "auto" }} />
                        </>
                    )}

                    {isLive ? (
                        <Tooltip
                            title={
                                searchTerm
                                    ? "Click to clear search and jump to live"
                                    : atLiveEdge
                                      ? "Click to pause auto-scroll"
                                      : "Click to resume auto-scroll live updates"
                            }
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    gap: 0.5,
                                    mx: 0.5,
                                }}
                                onClick={() => {
                                    if (searchTerm) {
                                        setSearchTerm("");
                                        setAtLiveEdge(true);
                                        setUnreadCount(0);
                                        scrollToLive();
                                    } else if (!atLiveEdge) {
                                        setAtLiveEdge(true);
                                        setUnreadCount(0);
                                        scrollToLive();
                                    } else {
                                        setAtLiveEdge(false);
                                    }
                                }}
                            >
                                <IconButton
                                    size="small"
                                    color={searchTerm ? "primary" : atLiveEdge ? "primary" : "warning"}
                                    sx={{ p: 0.5 }}
                                >
                                    {searchTerm ? (
                                        <Search fontSize="small" />
                                    ) : atLiveEdge ? (
                                        <Pause fontSize="small" />
                                    ) : (
                                        <PlayArrow fontSize="small" />
                                    )}
                                </IconButton>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        minWidth: 40,
                                        whiteSpace: "nowrap",
                                        fontWeight: "bold",
                                        color: searchTerm || atLiveEdge ? "primary.main" : "warning.main",
                                    }}
                                >
                                    {searchTerm
                                        ? "Searching"
                                        : atLiveEdge
                                          ? "Live"
                                          : unreadCount > 0
                                            ? `Click to Resume (${unreadCount})`
                                            : "Click to Resume"}
                                </Typography>
                            </Box>
                        </Tooltip>
                    ) : (
                        <Typography variant="caption" sx={{ minWidth: 45, whiteSpace: "nowrap" }}>
                            Offline
                        </Typography>
                    )}

                    {!atLiveEdge && (!isLive || !!searchTerm) && (
                        <>
                            <Divider orientation="vertical" flexItem sx={{ height: 20, my: "auto", ml: 1, mr: 0.5 }} />
                            <Tooltip title="Jump to Bottom">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    data-testid="transcript-jumpToBottom"
                                    onClick={() => {
                                        if (isOnline && isLive) {
                                            setAtLiveEdge(true);
                                            setUnreadCount(0);
                                        }
                                        scrollToLive();
                                    }}
                                >
                                    <VerticalAlignBottom fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}
