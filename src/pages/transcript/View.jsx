import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { Clear, ExpandLess, ExpandMore, Info, Search, ContentCut } from "@mui/icons-material";
import { useState, useMemo } from "react";
import LineMenu from "../../components/LineMenu";
import DevHeaderInfo from "../../components/DevHeaderInfo";
import { unixToLocal } from "../../logic/dateTime";
import { useAppStore } from "../../store/store";
import ViewSkeleton from "./ViewSkeleton";
import TranscriptVirtual from "./TranscriptVirtual";
import TranscriptPagination from "./TranscriptPagination";
import TranscriptFrame from "./TranscriptFrame";
import ConnectionBanner from "../../components/ConnectionBanner";
import { timeToSeconds } from "../../logic/tagHelpers";

/**
 * View component for the StreamLogs.
 * Acts as the main controller, displaying the header and the virtual transcript.
 *
 * @param {object} props
 * @param {string} props.wsKey
 */
export default function View({ wsKey }) {
    const activeId = useAppStore((state) => state.activeId);
    const activeTitle = useAppStore((state) => state.activeTitle);
    const isLive = useAppStore((state) => state.isLive);
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const transcript = useAppStore((state) => state.transcript);
    const serverStatus = useAppStore((state) => state.serverStatus);
    const transcriptHeight = useAppStore((state) => state.transcriptHeight);
    const devMode = useAppStore((state) => state.devMode);
    const useVirtualList = useAppStore((state) => state.useVirtualList);
    const setUseVirtualList = useAppStore((state) => state.setUseVirtualList);
    const formattedRows = useAppStore((state) => state.formattedRows);
    const clipMode = useAppStore((state) => state.clipMode);
    const toggleClipMode = useAppStore((state) => state.toggleClipMode);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);

    const [searchTerm, setSearchTerm] = useState("");
    const [pendingJumpId, setPendingJumpId] = useState(-1);
    const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);

    // 0: Pagination, 1: Virtual, 2: Visual Frames
    const [tabValue, setTabValue] = useState(useVirtualList ? 1 : 0);

    // Sync external changes to useVirtualList (e.g. from other tabs/persistence) to tabValue
    // Only if tabValue is 0 or 1. If it's 2, we stay on 2 unless mediaType changes.
    let targetTab = tabValue;
    if (tabValue !== 2) {
        targetTab = useVirtualList ? 1 : 0;
    } else if (mediaType !== "video") {
        targetTab = useVirtualList ? 1 : 0;
    }

    if (targetTab !== tabValue) {
        setTabValue(targetTab);
    }

    const isMobile = useMediaQuery("(max-width:768px)");
    const isOnline = serverStatus === "online";
    const isEmpty = transcript.length === 0 && activeTitle === "";
    const liveText = isLive ? "live" : "offline";

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

    const isOutOfSync = useMemo(() => {
        if (transcript.length < 2) return false;
        // Check for holes in the sequence
        for (let i = 1; i < transcript.length; i++) {
            if (transcript[i].id !== transcript[i - 1].id + 1) {
                return true;
            }
        }
        return false;
    }, [transcript]);

    const displayData = filteredTranscript;

    const jumpToLine = (/** @type {number} */ id) => {
        if (tabValue === 2) {
            setTabValue(useVirtualList ? 1 : 0);
        }
        if (searchTerm) {
            setSearchTerm("");
        }
        setPendingJumpId(id);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        if (newValue === 0) {
            setUseVirtualList(false);
        } else if (newValue === 1) {
            setUseVirtualList(true);
        }
        // If newValue is 2, we don't change useVirtualList preference,
        // or we could leave it as is so if they switch back it remembers the last list mode.
    };

    // Memoize tags map for performance
    const tagsMap = useMemo(() => {
        const map = new Map();
        if (!formattedRows || !displayData || displayData.length === 0) return map;

        const firstLine = displayData[0];
        const lastLine = displayData[displayData.length - 1];
        const firstLineTimestamp = firstLine.timestamp;
        const lastLineTimestamp = lastLine.timestamp;
        // const THRESHOLD = 5; // Seconds beyond last line

        // Optimized approach:
        // 1. Iterate tags.
        // 2. Binary search displayData for closest line.
        // 3. Scan segments in that line for closest segment.
        // 4. Map Key: `${lineId}_${segmentIndex}`

        formattedRows.forEach((row) => {
            if (row.timestamp) {
                const relativeSeconds = timeToSeconds(row.timestamp);
                const absoluteTimestamp = (startTime || 0) + relativeSeconds;

                // Filter out tags before first line or after last line
                if (absoluteTimestamp < firstLineTimestamp || absoluteTimestamp > lastLineTimestamp) {
                    return;
                }

                // Binary Search for Closest Line
                let low = 0;
                let high = displayData.length - 1;
                let closestLineIndex = -1;
                let minDiff = Infinity;

                while (low <= high) {
                    const mid = Math.floor((low + high) / 2);
                    const line = displayData[mid];
                    const diff = line.timestamp - absoluteTimestamp;

                    if (Math.abs(diff) < minDiff) {
                        minDiff = Math.abs(diff);
                        closestLineIndex = mid;
                    }

                    if (diff === 0) {
                        closestLineIndex = mid; // Exact match found
                        break;
                    } else if (diff < 0) {
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }

                // Check neighbors of closestLineIndex just in case
                let bestLine = displayData[closestLineIndex];

                if (bestLine) {
                    // Check neighbors
                    const candidates = [closestLineIndex - 1, closestLineIndex, closestLineIndex + 1];
                    candidates.forEach((idx) => {
                        if (idx >= 0 && idx < displayData.length) {
                            const line = displayData[idx];
                            if (
                                Math.abs(line.timestamp - absoluteTimestamp) <
                                Math.abs(bestLine.timestamp - absoluteTimestamp)
                            ) {
                                bestLine = line;
                            }
                        }
                    });

                    // Find closest segment in bestLine
                    let bestSegIndex = 0;
                    let minDifference = Math.abs(bestLine.timestamp - absoluteTimestamp);

                    if (bestLine.segments && bestLine.segments.length > 0) {
                        let minSegDiff = Math.abs(bestLine.segments[0].timestamp - absoluteTimestamp);

                        for (let i = 1; i < bestLine.segments.length; i++) {
                            const diff = Math.abs(bestLine.segments[i].timestamp - absoluteTimestamp);
                            if (diff < minSegDiff) {
                                minSegDiff = diff;
                                bestSegIndex = i;
                            }
                        }
                        minDifference = minSegDiff;
                    }

                    // Filter out tags that are too far from the closest line/segment
                    if (minDifference > 8) {
                        return;
                    }

                    // Assign Tag
                    const key = `${bestLine.id}_${bestSegIndex}`;
                    if (!map.has(key)) {
                        map.set(key, []);
                    }
                    map.get(key).push(row);
                }
            }
        });
        return map;
    }, [formattedRows, displayData, startTime]);

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

    const showTitle = !isHeaderMinimized || isMobile;

    const renderContent = () => {
        switch (tabValue) {
            case 2:
                return (
                    <TranscriptFrame displayData={displayData} activeId={activeId} wsKey={wsKey} tagsMap={tagsMap} />
                );
            case 1:
                return (
                    <TranscriptVirtual
                        displayData={displayData}
                        transcriptLength={transcript.length}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isLive={isLive}
                        isOnline={isOnline}
                        pendingJumpId={pendingJumpId}
                        setPendingJumpId={setPendingJumpId}
                        tagsMap={tagsMap}
                    />
                );
            case 0:
            default:
                return (
                    <TranscriptPagination
                        displayData={displayData}
                        pendingJumpId={pendingJumpId}
                        setPendingJumpId={setPendingJumpId}
                        tagsMap={tagsMap}
                    />
                );
        }
    };

    return (
        <>
            {serverStatus !== "online" && serverStatus !== "reconnecting" ? (
                <ViewSkeleton serverStatus={serverStatus} />
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
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                height: containerHeight,
                                bgcolor: "background.default",
                            }}
                        >
                            <Box sx={{ flexShrink: 0 }}>
                                {serverStatus === "reconnecting" && <ConnectionBanner />}
                                <LineMenu wsKey={wsKey} jumpToLine={jumpToLine} />
                                {showTitle && (
                                    <Tooltip title={streamInfoTooltip}>
                                        <Typography
                                            color="primary"
                                            variant="h5"
                                            component="h5"
                                            sx={{ wordBreak: "break-word", pl: isMobile ? 6 : 0 }}
                                        >
                                            {activeTitle}
                                        </Typography>
                                    </Tooltip>
                                )}
                                {!isHeaderMinimized && isLive && devMode && <DevHeaderInfo startTime={startTime} />}
                                {isOutOfSync && (
                                    <Box sx={{ p: 2, pb: 0 }}>
                                        <Typography color="warning.main" sx={{ fontWeight: "bold" }}>
                                            The current transcript is out of sync. Refresh to fix it.
                                        </Typography>
                                    </Box>
                                )}
                                {transcript.length > 0 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            width: "100%",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 1,
                                            mt: 2,
                                        }}
                                    >
                                        <TextField
                                            label="Search Transcript"
                                            variant="outlined"
                                            size="small"
                                            data-testid="search-transcript"
                                            id="search-transcript"
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
                                            <IconButton
                                                onClick={() => setSearchTerm("")}
                                                aria-label="clear search"
                                                data-testid="clear-search"
                                            >
                                                <Clear />
                                            </IconButton>
                                        )}
                                        <Tooltip title={clipMode ? "Exit Clip Mode" : "Enter Clip Mode"}>
                                            <Button
                                                data-testid="clip-mode-button"
                                                onClick={toggleClipMode}
                                                color={clipMode ? "secondary" : "primary"}
                                                variant={clipMode ? "contained" : "text"}
                                                startIcon={<ContentCut />}
                                                size="small"
                                                sx={{ ml: 1, whiteSpace: "nowrap" }}
                                            >
                                                {isMobile ? "Clip" : "Clip Mode"}
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={isHeaderMinimized ? "Show Header" : "Minimize Header"}>
                                            <IconButton onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}>
                                                {isHeaderMinimized ? <ExpandMore /> : <ExpandLess />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                                {clipMode && (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            mb: 1,
                                            px: 2,
                                            textAlign: "center",
                                        }}
                                    >
                                        <Typography variant="body2" color="secondary" sx={{ fontWeight: "bold" }}>
                                            {clipStartIndex === -1
                                                ? "Click on the line to set it as one end of the clip"
                                                : "Click on another line to set it as the start/end of the clip. Or click on the reset button to reset the clip selection"}
                                        </Typography>
                                    </Box>
                                )}
                                {!isHeaderMinimized && (
                                    <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mb: 1 }}>
                                        <Tabs
                                            value={tabValue}
                                            onChange={handleTabChange}
                                            sx={{ minHeight: "48px" }}
                                            indicatorColor="primary"
                                            textColor="primary"
                                            variant="scrollable"
                                            scrollButtons="auto"
                                            allowScrollButtonsMobile
                                        >
                                            <Tab
                                                data-testid="transcript-tab-pagination"
                                                label={
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: "bold", textTransform: "none" }}
                                                        >
                                                            New Lines at Top
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: "0.7rem",
                                                                opacity: 0.8,
                                                                textTransform: "none",
                                                            }}
                                                        >
                                                            Original Pagination
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ minHeight: "48px", py: 1, minWidth: "auto", px: 2 }}
                                            />
                                            <Tab
                                                data-testid="transcript-tab-virtual"
                                                label={
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: "bold", textTransform: "none" }}
                                                        >
                                                            New Lines at Bottom
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: "0.7rem",
                                                                opacity: 0.8,
                                                                textTransform: "none",
                                                            }}
                                                        >
                                                            Pauses when scrolling
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ minHeight: "48px", py: 1, minWidth: "auto", px: 2 }}
                                            />
                                            {mediaType === "video" && (
                                                <Tab
                                                    data-testid="transcript-tab-visual"
                                                    label={
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                alignItems: "center",
                                                                lineHeight: 1.2,
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ fontWeight: "bold", textTransform: "none" }}
                                                            >
                                                                Visual Frames
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontSize: "0.7rem",
                                                                    opacity: 0.8,
                                                                    textTransform: "none",
                                                                }}
                                                            >
                                                                Grid of Line Images
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{ minHeight: "48px", py: 1, minWidth: "auto", px: 2 }}
                                                />
                                            )}
                                        </Tabs>
                                    </Box>
                                )}
                                <hr />
                            </Box>

                            {renderContent()}
                        </Box>
                    )}
                </>
            )}
        </>
    );
}
