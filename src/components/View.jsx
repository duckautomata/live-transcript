import {
    Box,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { Clear, ExpandLess, ExpandMore, Info, Search } from "@mui/icons-material";
import { useState, useMemo } from "react";
import LineMenu from "./LineMenu";
import LiveTimer from "./Timer";
import { unixToLocal } from "../logic/dateTime";
import { useAppStore } from "../store/store";
import ViewSkeleton from "./ViewSkeleton";
import TranscriptVirtual from "./TranscriptVirtual";
import TranscriptPagination from "./TranscriptPagination";

/**
 * View component for the StreamLogs.
 * Acts as the main controller, displaying the header and the virtual transcript.
 *
 * @param {object} props
 * @param {string} props.wsKey
 */
export default function View({ wsKey }) {
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

    const [searchTerm, setSearchTerm] = useState("");
    const [pendingJumpId, setPendingJumpId] = useState(-1);
    const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);

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

    const displayData = filteredTranscript;

    const jumpToLine = (/** @type {number} */ id) => {
        if (searchTerm) {
            setSearchTerm("");
        }
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

    const showTitle = !isHeaderMinimized || isMobile;

    return (
        <>
            {!isOnline ? (
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
                                {!isHeaderMinimized && isLive && devMode && <LiveTimer startTime={startTime} />}
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
                                        <Tooltip title={isHeaderMinimized ? "Show Header" : "Minimize Header"}>
                                            <IconButton onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}>
                                                {isHeaderMinimized ? <ExpandMore /> : <ExpandLess />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                                {!isHeaderMinimized && (
                                    <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mb: 1 }}>
                                        <Tabs
                                            value={useVirtualList ? 1 : 0}
                                            onChange={(e, newValue) => setUseVirtualList(newValue === 1)}
                                            sx={{ minHeight: "48px" }}
                                            indicatorColor="primary"
                                            textColor="primary"
                                        >
                                            <Tab
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
                                        </Tabs>
                                    </Box>
                                )}
                                <hr />
                            </Box>

                            {useVirtualList ? (
                                <TranscriptVirtual
                                    displayData={displayData}
                                    transcriptLength={transcript.length}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    isLive={isLive}
                                    isOnline={isOnline}
                                    pendingJumpId={pendingJumpId}
                                    setPendingJumpId={setPendingJumpId}
                                />
                            ) : (
                                <TranscriptPagination
                                    displayData={displayData}
                                    pendingJumpId={pendingJumpId}
                                    setPendingJumpId={setPendingJumpId}
                                />
                            )}
                        </Box>
                    )}
                </>
            )}
        </>
    );
}
