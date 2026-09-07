import { Alert, Box, Pagination, Typography, useMediaQuery } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Line from "./Line";
import { LOG_MSG } from "../../logic/debug";

/** @typedef {import("../../store/types").TranscriptLine} TranscriptLine */

// 300 lines at 6 seconds per line is about 30 minutes per page
const LINES_PER_PAGE = 300;

/**
 * TranscriptPagination component for displaying logs with pagination.
 *
 * @param {object} props
 * @param {TranscriptLine[]} props.displayData - The filtered lines to display.
 * @param {number} props.pendingJumpId
 * @param {function(number)} props.setPendingJumpId
 * @param {Map<number, Record<number, any[]>>} props.tagsMap - Tag rows per line id (per segment index).
 * @param {number} props.startTime
 * @param {string} props.searchTerm - Normalized search term ("" when not filtering).
 * @param {string} props.linkBase - Path (+ search) line links are built on.
 * @param {function(MouseEvent, number): void} [props.onLineLinkClick] - Click handler for a line's timestamp link.
 */
export default function TranscriptPagination({
    displayData,
    pendingJumpId,
    setPendingJumpId,
    tagsMap,
    startTime,
    searchTerm,
    linkBase,
    onLineLinkClick,
}) {
    const [page, setPage] = useState(1);
    const [highlightedId, setHighlightedId] = useState(-1);
    const timersRef = useRef([]);
    const isMobile = useMediaQuery("(max-width:768px)");
    // Fewer page numbers on phones so the controls fit on one row without shrinking the touch targets.
    const paginationProps = { siblingCount: isMobile ? 0 : 1 };

    // A new search starts on its first page (the newest matches); clearing it returns the reader to the
    // page they were on before searching. Derived during render so the list never shows a stale page.
    const [pageForTerm, setPageForTerm] = useState(searchTerm);
    const [readingPage, setReadingPage] = useState(1);
    if (pageForTerm !== searchTerm) {
        if (pageForTerm === "") {
            setReadingPage(page);
        }
        setPageForTerm(searchTerm);
        setPage(searchTerm === "" ? readingPage : 1);
    }

    const totalPages = Math.ceil(displayData.length / LINES_PER_PAGE);
    let actualPage = Math.max(Math.min(totalPages, page), 1);

    if (actualPage !== page && totalPages > 0) {
        setPage(actualPage);
    }

    const handleChange = (event, /** @type {number} */ value) => {
        setPage(value);
    };

    /** @type {TranscriptLine[]} */
    let displayedLines = [];

    if (displayData.length > 0) {
        const start = displayData.length - actualPage * LINES_PER_PAGE;
        const end = start + LINES_PER_PAGE;
        displayedLines = displayData.slice(Math.max(0, start), Math.min(displayData.length, end)).reverse();
    }

    // Jump timers only need clearing on unmount: a new live line must not cancel a pending highlight removal.
    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        if (window.perfSyncReceivedAt && displayData.length > 0) {
            const renderCompletedAt = performance.now();
            const delta = renderCompletedAt - window.perfSyncReceivedAt;
            LOG_MSG(`[PERF] Sync -> Full Render (Pagination): ${delta.toFixed(2)}ms`);
            window.perfSyncReceivedAt = null;
        }
    }, [displayData]);

    // Handle Pending Jump
    useEffect(() => {
        if (pendingJumpId === -1) return;

        // 1. Check if line is in current displayData (filtered)
        const lineIndexInFiltered = displayData.findIndex((line) => line.id === pendingJumpId);

        if (lineIndexInFiltered === -1) {
            // Not found in filtered list
            setPendingJumpId(-1);
            return;
        }

        // Calculate page in filtered list
        const distFromEnd = displayData.length - 1 - lineIndexInFiltered;
        const targetPage = Math.floor(distFromEnd / LINES_PER_PAGE) + 1;

        // oxlint-disable-next-line react-hooks/set-state-in-effect
        setPage(targetPage);

        // We need to wait for render. Lines are found through their DOM id rather than a ref callback: a
        // fresh callback per render would defeat memo(Line) for every line on the page.
        timersRef.current.push(
            setTimeout(() => {
                const node = document.getElementById(String(pendingJumpId));
                if (node) {
                    node.scrollIntoView({ behavior: "auto", block: "center" });
                    setHighlightedId(pendingJumpId);
                    timersRef.current.push(
                        setTimeout(() => {
                            setHighlightedId(-1);
                        }, 2000),
                    );
                }
                setPendingJumpId(-1);
            }, 100),
        );
    }, [pendingJumpId, displayData, setPendingJumpId]);

    return (
        <Box sx={{ bgcolor: "background.default" }}>
            {displayedLines.length === 0 ? (
                searchTerm ? (
                    <Alert severity="info" data-testid="search-no-match" sx={{ mx: "auto", maxWidth: 600 }}>
                        No lines match “{searchTerm}”
                    </Alert>
                ) : (
                    <Typography>No transcripts at this time.</Typography>
                )
            ) : (
                <>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
                        <Pagination
                            {...paginationProps}
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
                            key={`streamLogsLine-${line.id}`}
                            id={line.id}
                            lineTimestamp={line.timestamp}
                            segments={line.segments}
                            highlight={highlightedId === line.id}
                            mediaAvailable={line.mediaAvailable}
                            vodAccurate={line.vodAccurate}
                            lineTags={tagsMap.get(line.id)}
                            startTime={startTime}
                            searchTerm={searchTerm}
                            linkBase={linkBase}
                            onLinkClick={onLineLinkClick}
                        />
                    ))}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                        <Pagination
                            {...paginationProps}
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
