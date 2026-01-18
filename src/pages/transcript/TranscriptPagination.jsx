import { Box, Pagination, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Line from "./Line";

/** @typedef {import("../../store/types").TranscriptLine} TranscriptLine */

/**
 * TranscriptPagination component for displaying logs with pagination.
 *
 * @param {object} props
 * @param {TranscriptLine[]} props.displayData - The filtered lines to display.
 * @param {number} props.pendingJumpId
 * @param {function(number)} props.setPendingJumpId
 * @param {Map<string, any[]>} props.tagsMap
 * @param {boolean} props.hasOverflow
 * @param {number} props.startTime
 */
export default function TranscriptPagination({ displayData, pendingJumpId, setPendingJumpId, tagsMap, startTime }) {
    const [page, setPage] = useState(1);
    const lineRefs = useRef(new Map());

    // 300 lines at 6 seconds per line is about 30 minutes per page
    const linesPerPage = 300;
    const totalPages = Math.ceil(displayData.length / linesPerPage);
    let actualPage = Math.max(Math.min(totalPages, page), 1);

    if (actualPage !== page && totalPages > 0) {
        setPage(actualPage);
    }

    const handleChange = (event, /** @type {number} */ value) => {
        setPage(value);
    };

    let start = 0;
    let end = 0;
    /** @type {TranscriptLine[]} */
    let displayedLines = [];

    if (displayData.length > 0) {
        start = displayData.length - actualPage * linesPerPage;
        end = start + linesPerPage;
        displayedLines = displayData.slice(Math.max(0, start), Math.min(displayData.length, end)).reverse();
    }

    // Handle Pending Jump
    useEffect(() => {
        if (pendingJumpId === -1) return;

        // 1. Check if line is in current displayData (filtered)
        const lineIndexInFiltered = displayData.findIndex((line) => line.id === pendingJumpId);

        if (lineIndexInFiltered !== -1) {
            // Calculate page in filtered list
            const distFromEnd = displayData.length - 1 - lineIndexInFiltered;
            const targetPage = Math.floor(distFromEnd / linesPerPage) + 1;

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPage(targetPage);

            // We need to wait for render
            setTimeout(() => {
                const node = lineRefs.current.get(pendingJumpId);
                if (node) {
                    node.scrollIntoView({ behavior: "auto", block: "center" });
                    node.classList.add("highlight");
                    setTimeout(() => {
                        node.classList.remove("highlight");
                    }, 2000);
                }
                setPendingJumpId(-1);
            }, 100);
        } else {
            // Not found in filtered list
            setPendingJumpId(-1);
        }
    }, [pendingJumpId, displayData, setPendingJumpId]);

    return (
        <Box sx={{ bgcolor: "background.default" }}>
            {displayedLines.length === 0 ? (
                <Typography>Nothing found.</Typography>
            ) : (
                <>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
                        <Pagination
                            count={totalPages}
                            page={actualPage}
                            onChange={handleChange}
                            showFirstButton
                            showLastButton
                            data-testid="transcript-pagination"
                        />
                    </Box>
                    {displayedLines.map((line) => (
                        <Line
                            ref={(/** @type {HTMLDivElement | null} */ node) => {
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
                            mediaAvailable={line.mediaAvailable}
                            tagsMap={tagsMap}
                            startTime={startTime}
                        />
                    ))}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                        <Pagination
                            count={totalPages}
                            page={actualPage}
                            onChange={handleChange}
                            showFirstButton
                            showLastButton
                        />
                    </div>
                </>
            )}
        </Box>
    );
}
