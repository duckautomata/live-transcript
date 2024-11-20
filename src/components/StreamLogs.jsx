import { Pagination, Typography } from "@mui/material";
import { useContext, useState } from "react";
import { TranscriptContext } from "../providers/TranscriptProvider";
import Line from "./Line";
import { SettingContext } from "../providers/SettingProvider";

export default function StreamLogs() {
    const { activeTitle, isLive, transcript } = useContext(TranscriptContext);
    const { newAtTop, wsKey } = useContext(SettingContext);
    const [page, setPage] = useState(1);

    const liveText = isLive ? "live" : "offline";

    const mapArray = [...transcript];

    // 300 lines at 8 seconds per line is about 40 mins per page
    const linesPerPage = 300;
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
                Stream is {liveText}.
            </Typography>
            <hr />
            <div className="transcript">
                {displayedLines.length === 0 ? (
                    <Typography>No transcripts at this time.</Typography>
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
                        {displayedLines.slice(0).map((line, index) => (
                            <Line
                                key={line?.id}
                                id={line?.id}
                                segments={line?.segments}
                                isEven={index % 2 === 0}
                                audioUrl={`https://dokiscripts.com/${wsKey}/audio?id=${line?.id}`}
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
