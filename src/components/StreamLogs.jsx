import {
    Box,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    Paper,
    Divider,
} from "@mui/material";
import { useEffect, useRef, useState, useMemo } from "react";
import Line from "./Line";
import { Clear, Info, Search, VerticalAlignTop, VerticalAlignBottom, Pause, PlayArrow } from "@mui/icons-material";
import LineMenu from "./LineMenu";
import { useAppStore } from "../store/store";
import StreamLogsSkeleton from "./StreamLogsSkeleton";
import { unixToLocal } from "../logic/dateTime";
import LiveTimer from "./Timer";
import { Virtuoso } from "react-virtuoso";

/**
 * Component for displaying and searching the transcript logs.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
export default function StreamLogs({ wsKey }) {
    const activeTitle = useAppStore((state) => state.activeTitle);
    const isLive = useAppStore((state) => state.isLive);
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const transcript = useAppStore((state) => state.transcript);
    const serverStatus = useAppStore((state) => state.serverStatus);
    const transcriptHeight = useAppStore((state) => state.transcriptHeight);
    const devMode = useAppStore((state) => state.devMode);

    const [searchTerm, setSearchTerm] = useState("");
    const isMobile = useMediaQuery("(max-width:768px)");

    // Virtualization refs and state
    const virtuosoRef = useRef(null);
    const [atLiveEdge, setAtLiveEdge] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });
    const transcriptLengthRef = useRef(transcript.length);
    const atBottomTimerRef = useRef(null);
    const lastStreamUpdateRef = useRef(0);

    // Jump / Highlight state
    const [pendingJumpId, setPendingJumpId] = useState(-1);
    const [highlightedId, setHighlightedId] = useState(-1);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (atBottomTimerRef.current) {
                clearTimeout(atBottomTimerRef.current);
            }
        };
    }, []);

    const liveText = isLive ? "live" : "offline";
    const isOnline = serverStatus === "online";
    const isEmpty = transcript.length === 0 && activeTitle === "";

    // Height calculation
    const heightMap = {
        "100%": "100vh",
        "90%": "90vh",
        "75%": "75vh",
        "50%": "50vh",
    };
    const containerHeight = `calc(${heightMap[transcriptHeight] || "100vh"} - 24px)`;

    // Filter transcript based on search term
    const filteredTranscript = useMemo(() => {
        if (!searchTerm) {
            return transcript;
        }
        return transcript.filter((line) => {
            let text = "";
            line?.segments?.forEach((segment) => {
                text += segment.text + " ";
            });
            return text.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [transcript, searchTerm]);

    // Data is always chronological (new lines at bottom)
    const displayData = filteredTranscript;

    const scrollToLive = () => {
        if (virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({ index: displayData.length - 1, align: "end", behavior: "auto" });
        }
    };

    // Handle incoming messages
    useEffect(() => {
        const newLines = transcript.length - transcriptLengthRef.current;
        transcriptLengthRef.current = transcript.length;

        if (newLines > 0) {
            lastStreamUpdateRef.current = Date.now();
            if (!atLiveEdge) {
                setUnreadCount((prev) => prev + newLines);
            }
        }
    }, [transcript.length, atLiveEdge]);

    // Force scroll to live edge on new stream
    useEffect(() => {
        if (displayData.length > 0) {
            setTimeout(() => {
                scrollToLive();
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsKey, activeTitle]);

    // Handle Pending Jump
    useEffect(() => {
        if (pendingJumpId !== -1 && virtuosoRef.current) {
            const index = displayData.findIndex((line) => line.id === pendingJumpId);
            if (index !== -1) {
                // Determine alignment: 'start' puts it at the top which is very clear
                virtuosoRef.current.scrollToIndex({
                    index,
                    align: "start",
                    behavior: "auto",
                });

                // Set highlight
                setTimeout(() => {
                    setHighlightedId(pendingJumpId);
                    setPendingJumpId(-1);
                    setTimeout(() => {
                        setHighlightedId(-1);
                    }, 2000);
                }, 0);
            }
        }
    }, [displayData, pendingJumpId]);

    const jumpToLine = (/** @type {number} */ id) => {
        // Stop sticking to live edge when we jump
        setAtLiveEdge(false);

        // If we are searching, check if it's in the current view
        if (searchTerm) {
            setSearchTerm("");
        }

        // Trigger the effect
        setPendingJumpId(id);
    };

    const streamInfoTooltip = (
        <div>
            <p style={{ margin: 0 }}>
                <strong>Stream status:</strong> {liveText}
            </p>
            <p style={{ margin: "4px 0 0" }}>
                <strong>Start Time:</strong> {unixToLocal(startTime)}
            </p>
            <p style={{ margin: "4px 0 0" }}>
                <strong>Media Available:</strong>{" "}
                {mediaType === "video" ? "Video and Audio" : mediaType === "audio" ? "Audio Only" : "None"}
            </p>
        </div>
    );

    return (
        <>
            {!isOnline ? (
                <StreamLogsSkeleton serverStatus={serverStatus} />
            ) : (
                <>
                    {isEmpty ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                height: containerHeight,
                            }}
                        >
                            <Info color="primary" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                                No Data Available for {wsKey.charAt(0).toUpperCase() + wsKey.slice(1)}
                            </Typography>
                            <Typography color="text.secondary">No transcript data was found.</Typography>
                            <Typography color="text.secondary">
                                This usually happens when the server data is reset.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", height: containerHeight }}>
                            <Box sx={{ flexShrink: 0 }}>
                                <LineMenu wsKey={wsKey} jumpToLine={jumpToLine} />
                                <Tooltip title={streamInfoTooltip}>
                                    <Typography
                                        color="primary"
                                        variant="h5"
                                        component="h5"
                                        sx={{ mb: 2, wordBreak: "break-word", pl: isMobile ? 6 : 0 }}
                                    >
                                        {activeTitle}
                                    </Typography>
                                </Tooltip>
                                {isLive && devMode && <LiveTimer startTime={startTime} />}
                                {transcript.length > 0 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            width: "100%",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 1,
                                        }}
                                    >
                                        <TextField
                                            label="Search Transcript"
                                            variant="outlined"
                                            size="small"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Search />
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                            sx={{ width: isMobile ? "100%" : "50%" }}
                                        />
                                        {searchTerm && (
                                            <IconButton onClick={() => setSearchTerm("")} aria-label="clear search">
                                                <Clear />
                                            </IconButton>
                                        )}
                                    </Box>
                                )}
                                <hr />
                            </Box>

                            <Box sx={{ flexGrow: 1, position: "relative", minHeight: 0 }}>
                                {displayData.length === 0 ? (
                                    transcript.length === 0 ? (
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
                                                // Ignore "not at bottom" if we just received new data (within 1s)
                                                // This prevents flickering on slow devices where auto-scroll lags
                                                if (Date.now() - lastStreamUpdateRef.current < 350) {
                                                    return;
                                                }

                                                // Debounce setting to false for user interactions
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
                                            />
                                        )}
                                        followOutput={atLiveEdge ? "auto" : false}
                                        initialTopMostItemIndex={displayData.length - 1}
                                        style={{ height: "100%" }}
                                        defaultItemHeight={30}
                                        rangeChanged={(range) => {
                                            const dist = displayData.length - 1 - range.endIndex;
                                            setVisibleRange(range);

                                            // Safety check: specific case where user scrolls up quickly while logs are streaming.
                                            // The atBottomStateChange might ignore the transition due to the grace period,
                                            // but if we are significantly far from bottom (>5 lines), we must pause.
                                            if (atLiveEdge && dist > 5) {
                                                setAtLiveEdge(false);
                                            }
                                        }}
                                    />
                                )}
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    p: 1,
                                    zIndex: 10,
                                }}
                            >
                                <Paper
                                    elevation={4}
                                    sx={{
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
                                                    ? `${displayData.length} / ${transcript.length} found`
                                                    : !atLiveEdge && visibleRange.endIndex < transcript.length - 1
                                                      ? `${visibleRange.startIndex + 1}-${visibleRange.endIndex + 1} / ${transcript.length}`
                                                      : `${transcript.length} lines`}
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
                                                        color:
                                                            searchTerm || atLiveEdge ? "primary.main" : "warning.main",
                                                    }}
                                                >
                                                    {searchTerm
                                                        ? "Searching"
                                                        : atLiveEdge
                                                          ? "Live"
                                                          : unreadCount > 0
                                                            ? `Paused (${unreadCount})`
                                                            : "Paused"}
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
                                            <Divider
                                                orientation="vertical"
                                                flexItem
                                                sx={{ height: 20, my: "auto", ml: 1, mr: 0.5 }}
                                            />
                                            <Tooltip title="Jump to Bottom">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
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
                    )}
                </>
            )}
        </>
    );
}
