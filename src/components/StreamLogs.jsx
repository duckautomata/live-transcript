import { Box, IconButton, InputAdornment, Pagination, TextField, Typography } from "@mui/material";
import { useContext, useState } from "react";
import { TranscriptContext } from "../providers/TranscriptProvider";
import Line from "./Line";
import { SettingContext } from "../providers/SettingProvider";
import { Clear, Search } from "@mui/icons-material";

export default function StreamLogs({ wsKey }) {
    const { activeTitle, startTime, isLive, transcript } = useContext(TranscriptContext);
    const { newAtTop, timeFormat } = useContext(SettingContext);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const liveText = isLive ? "live" : "offline";

    const mapArray = transcript.filter((line) => {
        let text = "";
        line?.segments?.forEach((segment) => {
            text += segment.text + " ";
        });
        return text.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // 450 lines at 8 seconds per line is about 1 hour per page
    const linesPerPage = 450;
    const totalPages = Math.ceil(mapArray.length / linesPerPage);
    const actualPage = Math.max(Math.min(totalPages, page), 1);

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

    return (
        <>
            <Typography color="primary" variant="h4" component="h1" sx={{ mb: 2 }}>
                {activeTitle}
            </Typography>
            <Typography color="secondary" variant="h6" component="h1" sx={{ mb: 2 }} id={liveText}>
                {wsKey.charAt(0).toUpperCase() + wsKey.slice(1)}&#39;s Stream is {liveText}.
            </Typography>
            {transcript.length > 0 && (
                <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center" }}>
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
                        sx={{ width: window.innerWidth < 600 ? "100%" : "60%" }}
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
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handleChange}
                                showFirstButton
                                showLastButton
                            />
                        </div>
                        {displayedLines.slice(0).map((line) => (
                            <Line
                                key={line?.id}
                                id={line?.id}
                                segments={line?.segments}
                                timeFormat={timeFormat}
                                startTime={startTime}
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
    );
}
