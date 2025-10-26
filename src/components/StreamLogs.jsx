import {
    Box,
    IconButton,
    InputAdornment,
    Pagination,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Line from "./Line";
import { Clear, Info, Search } from "@mui/icons-material";
import LineMenu from "./LineMenu";
import { useAppStore } from "../store/store";
import StreamLogsSkeleton from "./StreamLogsSkeleton";
import { unixToLocal } from "../logic/dateTime";

export default function StreamLogs({ wsKey }) {
    const activeTitle = useAppStore((state) => state.activeTitle);
    const isLive = useAppStore((state) => state.isLive);
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const transcript = useAppStore((state) => state.transcript);
    const serverStatus = useAppStore((state) => state.serverStatus);
    const newAtTop = useAppStore((state) => state.newAtTop);

    const [page, setPage] = useState(1);
    const [jumpId, setJumpId] = useState(-1);
    const [searchTerm, setSearchTerm] = useState("");
    const isMobile = useMediaQuery("(max-width:768px)");
    const lineRefs = useRef(new Map());

    const liveText = isLive ? "live" : "offline";
    const isOnline = serverStatus === "online";
    const isEmpty = transcript.length === 0 && activeTitle === "";
    const mapArray = transcript.filter((line) => {
        let text = "";
        line?.segments?.forEach((segment) => {
            text += segment.text + " ";
        });
        return text.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // 300 lines at 6 seconds per line is about 30 minutes per page
    const linesPerPage = 300;
    const totalPages = Math.ceil(mapArray.length / linesPerPage);
    let actualPage = Math.max(Math.min(totalPages, page), 1);

    if (actualPage !== page) {
        setPage(actualPage);
    }

    const handleChange = (event, value) => {
        setPage(value);
    };

    let start = 0;
    let end = 0;
    let displayedLines = [];

    if (mapArray.length > 0 && newAtTop) {
        start = mapArray.length - actualPage * linesPerPage;
        end = start + linesPerPage;
        displayedLines = mapArray.slice(Math.max(0, start), Math.min(mapArray.length, end)).reverse();
    } else if (mapArray.length > 0) {
        start = (actualPage - 1) * linesPerPage;
        end = start + linesPerPage;
        displayedLines = mapArray.slice(start, end);
    }

    const jumpToLine = (id) => {
        // Find the index of the line in the full, unfiltered transcript
        const lineIndex = transcript.findIndex((line) => line.id === id);
        if (lineIndex === -1) return; // Line not found

        // Calculate the page this line will be on
        let actualJumpId = id;
        if (newAtTop) {
            actualJumpId = transcript.at(-1).id - id;
        }
        const totalNumberUnfilteredPages = Math.ceil(transcript.length / linesPerPage);
        const jumpToPage = Math.ceil((actualJumpId + 1) / linesPerPage);
        const jumpToActualPage = Math.max(Math.min(totalNumberUnfilteredPages, jumpToPage), 1);

        setSearchTerm("");
        setPage(jumpToActualPage);
        setJumpId(id);
    };

    useEffect(() => {
        if (jumpId === -1) return;

        const node = lineRefs.current.get(jumpId);
        if (node) {
            setTimeout(() => {
                node.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                node.classList.add("highlight");
                setTimeout(() => {
                    node.classList.remove("highlight");
                }, 2000);
                setJumpId(-1);
            }, 100);
        }
    }, [jumpId]);

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
                                height: "50vh",
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
                        <>
                            <LineMenu wsKey={wsKey} jumpToLine={jumpToLine} />
                            <Tooltip title={streamInfoTooltip}>
                                <Typography
                                    color="primary"
                                    variant="h5"
                                    component="h5"
                                    sx={{ mb: 2, wordBreak: "break-word" }}
                                >
                                    {activeTitle}
                                </Typography>
                            </Tooltip>
                            {transcript.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        width: "100%",
                                        alignItems: "center",
                                        justifyContent: "center",
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
                                    {searchTerm && ( // Conditionally render clear button
                                        <IconButton
                                            onClick={() => {
                                                setSearchTerm("");
                                            }}
                                            aria-label="clear search"
                                        >
                                            <Clear />
                                        </IconButton>
                                    )}
                                </Box>
                            )}
                            <hr />
                            <div className="transcript">
                                {displayedLines.length === 0 ? (
                                    transcript.length === 0 ? (
                                        <Typography>No transcripts at this time.</Typography>
                                    ) : (
                                        <Typography>Nothing found.</Typography>
                                    )
                                ) : (
                                    <>
                                        <div
                                            style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}
                                        >
                                            <Pagination
                                                count={totalPages}
                                                page={page}
                                                onChange={handleChange}
                                                showFirstButton
                                                showLastButton
                                            />
                                        </div>
                                        {displayedLines.map((line) => (
                                            <Line
                                                ref={(node) => {
                                                    if (node) {
                                                        lineRefs.current.set(line.id, node);
                                                    } else {
                                                        lineRefs.current.delete(line.id);
                                                    }
                                                }}
                                                key={`streamLogsLine-${line.id}`}
                                                id={line.id}
                                                lineTimestamp={line.timestamp}
                                                segments={line.segments}
                                            />
                                        ))}
                                        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                                            <Pagination
                                                count={totalPages}
                                                page={page}
                                                onChange={handleChange}
                                                showFirstButton
                                                showLastButton
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </>
    );
}
