import {
    Box,
    Button,
    Divider,
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
import { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LineMenu from "../../components/LineMenu";
import DevHeaderInfo from "../../components/DevHeaderInfo";
import { useAppStore } from "../../store/store";
import ViewSkeleton from "./ViewSkeleton";
import TranscriptVirtual from "./TranscriptVirtual";
import TranscriptPagination from "./TranscriptPagination";
import TranscriptFrame from "./TranscriptFrame";
import TranscriptSkeleton from "./TranscriptSkeleton";
import ConnectionBanner from "../../components/ConnectionBanner";
import { timeToSeconds } from "../../logic/tagHelpers";
import ViewTitleSelection from "./ViewTitleSelection";
import { server } from "../../config";
import { filterTranscript, normalizeSearchTerm } from "../../logic/search";
import { STREAM_PARAM, parseLineHash } from "../../logic/links";

/** Shared by every render without tags so memoized lines keep receiving a stable `undefined`. */
const EMPTY_TAGS = new Map();

/**
 * View component for the StreamLogs.
 * Acts as the main controller, displaying the header and the virtual transcript.
 *
 * The URL carries two pieces of view state so any line or past stream can be linked to, opened in a new
 * tab, and restored with back/forward: `?stream=<id>` (the past stream being viewed) and `#L<id>` (a line
 * to scroll to and highlight).
 *
 * @param {object} props
 * @param {string} props.wsKey
 */
export default function View({ wsKey }) {
    const streamId = useAppStore((state) => state.streamId);
    const streamTitle = useAppStore((state) => state.streamTitle);
    const isLive = useAppStore((state) => state.isLive);
    const isSynced = useAppStore((state) => state.isSynced);
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const mediaBaseUrl = useAppStore((state) => state.mediaBaseUrl);
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
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);

    const pastStreams = useAppStore((state) => state.pastStreams);
    const pastStreamsLoaded = useAppStore((state) => state.pastStreamsLoaded);
    const pastStreamViewing = useAppStore((state) => state.pastStreamViewing);
    const setPastStreamViewing = useAppStore((state) => state.setPastStreamViewing);
    const pastStreamTranscript = useAppStore((state) => state.pastStreamTranscript);
    const setPastStreamTranscript = useAppStore((state) => state.setPastStreamTranscript);
    const resetPastStreamTranscript = useAppStore((state) => state.resetPastStreamTranscript);

    const location = useLocation();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [pendingJumpId, setPendingJumpId] = useState(-1);
    const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
    const [isLoadingPastStream, setIsLoadingPastStream] = useState(false);
    const [pastStreamError, setPastStreamError] = useState(null);
    const searchInputRef = useRef(null);

    // ---------------------------------------------------------------------------------------------
    // Past stream selection: while this view is mounted the `?stream=` search param is the source of
    // truth and the store mirrors it, so links, new tabs and back/forward all agree.
    // ---------------------------------------------------------------------------------------------
    const streamParam = useMemo(() => new URLSearchParams(location.search).get(STREAM_PARAM), [location.search]);
    // Until the server has listed its past streams, a `?stream=` cannot be resolved (start time, media type),
    // so the content area shows a skeleton instead of a transcript with zeroed stream info.
    const showPastStreamLoading = isLoadingPastStream || (!!streamParam && !pastStreamsLoaded);

    useEffect(() => {
        setPastStreamViewing(streamParam);
    }, [streamParam, setPastStreamViewing]);

    useEffect(() => {
        return () => {
            setPastStreamViewing(null);
        };
    }, [setPastStreamViewing]);

    // Drop a `?stream=` that points at the live stream or at a stream the server no longer has.
    useEffect(() => {
        if (!streamParam) return;
        const isLiveStream = streamId !== "" && streamParam === streamId;
        const isUnknown = pastStreamsLoaded && !pastStreams.some((s) => s.streamId === streamParam);
        if (!isLiveStream && !isUnknown) return;

        const params = new URLSearchParams(location.search);
        params.delete(STREAM_PARAM);
        const search = params.toString();
        // Say why the page did not open where the link pointed (unless the deleted-stream toast already does).
        if (isUnknown && !useAppStore.getState().deletedStreamNotice) {
            useAppStore.getState().showToast("That stream is no longer available, showing the latest one", "info");
        }
        // A line hash belongs to the stream it was made on: keep it for the live stream, drop it with a
        // stream the server no longer has.
        navigate(
            { pathname: location.pathname, search: search ? `?${search}` : "", hash: isUnknown ? "" : location.hash },
            { replace: true },
        );
    }, [
        streamParam,
        streamId,
        pastStreamsLoaded,
        pastStreams,
        location.pathname,
        location.search,
        location.hash,
        navigate,
    ]);

    // Audio playback and a half-built clip belong to the stream they were started on.
    useEffect(() => {
        setAudioId(-1);
        setClipStartIndex(-1);
        setClipEndIndex(-1);
    }, [pastStreamViewing, setAudioId, setClipStartIndex, setClipEndIndex]);

    // Fetch past stream transcript when viewing a past stream
    useEffect(() => {
        let active = true;

        const fetchTranscript = async () => {
            if (!pastStreamViewing) {
                resetPastStreamTranscript();
                setIsLoadingPastStream(false);
                setPastStreamError(null);
                return;
            }

            setIsLoadingPastStream(true);
            setPastStreamError(null);
            try {
                const response = await fetch(`${server}/${wsKey}/transcript/${pastStreamViewing}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch transcript");
                }
                const data = await response.json();
                if (active) {
                    setPastStreamTranscript(data);
                }
            } catch (error) {
                if (active) {
                    setPastStreamError(error.message);
                }
            } finally {
                if (active) {
                    setIsLoadingPastStream(false);
                }
            }
        };

        fetchTranscript();

        return () => {
            active = false;
        };
    }, [pastStreamViewing, wsKey, setPastStreamTranscript, resetPastStreamTranscript]);

    const currentStreamInfo = useMemo(() => {
        if (pastStreamViewing) {
            return pastStreams.find((s) => s.streamId === pastStreamViewing);
        }
        return null;
    }, [pastStreamViewing, pastStreams]);

    const activeIsLive = pastStreamViewing ? (currentStreamInfo?.isLive ?? false) : isLive;
    const activeStartTime = pastStreamViewing ? (currentStreamInfo?.startTime ?? 0) : startTime;
    const activeMediaType = pastStreamViewing ? (currentStreamInfo?.mediaType ?? "none") : mediaType;

    // 0: Pagination, 1: Virtual, 2: Visual Frames
    const [tabValue, setTabValue] = useState(useVirtualList ? 1 : 0);

    // Sync external changes to useVirtualList (e.g. from other tabs/persistence) to tabValue
    // Only if tabValue is 0 or 1. If it's 2, we stay on 2 unless mediaType changes.
    let targetTab = tabValue;
    if (tabValue !== 2) {
        targetTab = useVirtualList ? 1 : 0;
    } else if (activeMediaType !== "video") {
        targetTab = useVirtualList ? 1 : 0;
    }

    if (targetTab !== tabValue) {
        setTabValue(targetTab);
    }

    const isMobile = useMediaQuery("(max-width:768px)");
    const isOnline = serverStatus === "online";
    const isEmpty = !pastStreamViewing && !streamParam && transcript.length === 0 && streamTitle === "";

    // Height: see the .view-height-* classes in App.css (dvh with a vh fallback for older browsers).
    const heightMap = {
        "100%": 100,
        "90%": 90,
        "75%": 75,
        "50%": 50,
    };
    const containerHeightClass = `view-height-${heightMap[transcriptHeight] || 100}`;

    // Use correct transcript based on mode
    const activeTranscript = pastStreamViewing ? pastStreamTranscript : transcript;

    // ---------------------------------------------------------------------------------------------
    // Search. Typing is deferred so the input never waits for the list to re-render; clearing applies
    // at once (it is cheap, and jump-to-line relies on the unfiltered list being there immediately).
    // ---------------------------------------------------------------------------------------------
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const activeSearchTerm = normalizeSearchTerm(searchTerm === "" ? "" : deferredSearchTerm);
    const isFiltering = activeSearchTerm !== "";

    const filteredTranscript = useMemo(
        () => filterTranscript(activeTranscript, activeSearchTerm),
        [activeTranscript, activeSearchTerm],
    );

    // Latest filtered list for the hash effect below, without re-running it on every keystroke.
    const filteredTranscriptRef = useRef(filteredTranscript);
    filteredTranscriptRef.current = filteredTranscript;

    const isOutOfSync = useMemo(() => {
        if (activeTranscript.length < 2) return false;
        // Check for holes in the sequence
        for (let i = 1; i < activeTranscript.length; i++) {
            if (activeTranscript[i].id !== activeTranscript[i - 1].id + 1) {
                return true;
            }
        }
        return false;
    }, [activeTranscript]);

    const displayData = filteredTranscript;

    /** Base every line link is built on, so `?stream=` survives a click on a timestamp. */
    const linkBase = location.pathname + location.search;

    // ---------------------------------------------------------------------------------------------
    // Jumping to a line. React Router applies a navigation as a low-priority transition, so the URL
    // (and any effect keyed on it) can commit well after the click. In-app clicks therefore jump right
    // away and pre-announce the line id; the hash effect below only acts on navigations it was not told
    // about (initial load, back/forward, a pasted link).
    // ---------------------------------------------------------------------------------------------
    const expectedHashJumpRef = useRef(null);
    const handledJumpKeyRef = useRef(null);

    /**
     * Show a line: leave the frame grid for the list the user last used, drop the filter when the line
     * is hidden by it (or when asked to), and scroll to the line.
     */
    const revealLine = useCallback((/** @type {number} */ id, { clearSearch = false } = {}) => {
        expectedHashJumpRef.current = id;
        setTabValue((current) => (current === 2 ? (useAppStore.getState().useVirtualList ? 1 : 0) : current));
        if (clearSearch || !filteredTranscriptRef.current.some((line) => line.id === id)) {
            setSearchTerm("");
        }
        setPendingJumpId(id);
    }, []);

    /** "Jump to line" from the line menu: show the line in the full, unfiltered transcript. */
    const jumpToLine = useCallback((/** @type {number} */ id) => revealLine(id, { clearSearch: true }), [revealLine]);

    /** A click on a line's timestamp link. Modified clicks are left to the browser (new tab / window). */
    const handleLineLinkClick = useCallback(
        (event, /** @type {number} */ id) => {
            if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
            revealLine(id);
        },
        [revealLine],
    );

    // Scroll to and highlight the line named in the hash (#L<id>) for navigations that did not come from a
    // click handled above. location.key makes re-navigating to the same hash scroll again. Waits until the
    // transcript it refers to has fully loaded so a deep link opened in a new tab lands on the right line.
    const dataReady = pastStreamViewing ? !isLoadingPastStream && pastStreamTranscript.length > 0 : isSynced;
    useEffect(() => {
        const targetId = parseLineHash(location.hash);
        if (targetId === null || handledJumpKeyRef.current === location.key) return;

        if (expectedHashJumpRef.current === targetId) {
            // An in-app click already performed this jump.
            expectedHashJumpRef.current = null;
            handledJumpKeyRef.current = location.key;
            return;
        }

        if (!dataReady) return;
        // Not there yet: keep checking as lines arrive (a link shared during a live stream can be a few
        // seconds ahead of this client). The check is cheap and stops once the line shows up.
        if (!activeTranscript.some((line) => line.id === targetId)) return;
        handledJumpKeyRef.current = location.key;
        revealLine(targetId);
    }, [location.key, location.hash, dataReady, activeTranscript, revealLine]);

    // Ctrl/Cmd+F focuses the transcript search (the browser's find cannot see virtualized lines);
    // Escape clears it, then blurs it. Left alone while a dialog or menu is open.
    useEffect(() => {
        const handleKeyDown = (event) => {
            const input = searchInputRef.current;
            if (!input) return;

            if (
                (event.ctrlKey || event.metaKey) &&
                !event.altKey &&
                !event.shiftKey &&
                event.key.toLowerCase() === "f"
            ) {
                // Leave the browser's own find alone while a dialog or menu is open, or when the field
                // already has focus (a second Ctrl+F then reaches the page as usual).
                if (document.querySelector(".MuiModal-root") || document.activeElement === input) return;
                event.preventDefault();
                input.focus();
                input.select();
            } else if (event.key === "Escape" && document.activeElement === input) {
                if (input.value) {
                    setSearchTerm("");
                } else {
                    input.blur();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    /** Clears the search and puts the cursor back into the field. */
    const handleClearSearch = () => {
        setSearchTerm("");
        searchInputRef.current?.focus();
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

    // Tag helper markers, keyed by line id and then segment index. Built from the whole transcript (not
    // the filtered list) so typing never rebuilds it and a tag always sits on its true nearest line. A
    // shared empty map is returned when there are no tags, so memoized lines keep a stable `undefined`.
    const tagsMap = useMemo(() => {
        if (!formattedRows?.length || activeTranscript.length === 0) return EMPTY_TAGS;

        const map = new Map();
        const lines = activeTranscript;
        const firstLineTimestamp = lines[0].timestamp;
        const lastLineTimestamp = lines[lines.length - 1].timestamp;
        const baseTime = Number(activeStartTime) || 0;

        formattedRows.forEach((row) => {
            // Collection headers share a timestamp with their first tag, which already
            // carries the group name in its tooltip - skip them to avoid duplicate entries.
            if (row.type === "header" && row.subtype === "collection") return;
            if (!row.timestamp) return;
            const absoluteTimestamp = baseTime + timeToSeconds(row.timestamp);

            // Filter out tags before first line or after last line
            if (absoluteTimestamp < firstLineTimestamp || absoluteTimestamp > lastLineTimestamp) {
                return;
            }

            // Binary search for the closest line
            let low = 0;
            let high = lines.length - 1;
            let closestLineIndex = -1;
            let minDiff = Infinity;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const diff = lines[mid].timestamp - absoluteTimestamp;

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

            let bestLine = lines[closestLineIndex];
            if (!bestLine) return;

            // Check neighbors just in case
            for (const idx of [closestLineIndex - 1, closestLineIndex + 1]) {
                const line = lines[idx];
                if (
                    line &&
                    Math.abs(line.timestamp - absoluteTimestamp) < Math.abs(bestLine.timestamp - absoluteTimestamp)
                ) {
                    bestLine = line;
                }
            }

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

            let lineTags = map.get(bestLine.id);
            if (!lineTags) {
                lineTags = {};
                map.set(bestLine.id, lineTags);
            }
            (lineTags[bestSegIndex] ??= []).push(row);
        });
        return map;
    }, [formattedRows, activeTranscript, activeStartTime]);

    const showTitle = !isHeaderMinimized || isMobile;

    // A different stream is a different list: remounting it starts at the newest line and resets the
    // page / live-edge / unread state instead of keeping the scroll position of the previous transcript.
    const activeStreamKey = pastStreamViewing || "live";

    const renderContent = () => {
        switch (tabValue) {
            case 2:
                return (
                    <TranscriptFrame
                        key={activeStreamKey}
                        mediaBaseUrl={mediaBaseUrl}
                        displayData={displayData}
                        streamId={pastStreamViewing || streamId}
                        wsKey={wsKey}
                        tagsMap={tagsMap}
                        startTime={activeStartTime}
                        searchTerm={activeSearchTerm}
                        linkBase={linkBase}
                        onLineLinkClick={handleLineLinkClick}
                    />
                );
            case 1:
                return (
                    <TranscriptVirtual
                        key={activeStreamKey}
                        displayData={displayData}
                        transcriptLength={activeTranscript.length}
                        searchTerm={activeSearchTerm}
                        setSearchTerm={setSearchTerm}
                        isLive={activeIsLive}
                        isOnline={isOnline}
                        pendingJumpId={pendingJumpId}
                        setPendingJumpId={setPendingJumpId}
                        tagsMap={tagsMap}
                        startTime={activeStartTime}
                        linkBase={linkBase}
                        onLineLinkClick={handleLineLinkClick}
                    />
                );
            case 0:
            default:
                return (
                    <TranscriptPagination
                        key={activeStreamKey}
                        displayData={displayData}
                        pendingJumpId={pendingJumpId}
                        setPendingJumpId={setPendingJumpId}
                        tagsMap={tagsMap}
                        startTime={activeStartTime}
                        searchTerm={activeSearchTerm}
                        linkBase={linkBase}
                        onLineLinkClick={handleLineLinkClick}
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
                            className={containerHeightClass}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                            }}
                        >
                            {pastStreamError ? (
                                <>
                                    <Typography variant="h6" color="error" gutterBottom>
                                        Error Loading Transcript
                                    </Typography>
                                    <Typography variant="body1">{pastStreamError}</Typography>
                                </>
                            ) : (
                                <>
                                    <Info color="primary" sx={{ fontSize: 60, mb: 2 }} />
                                    <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                                        No Data Available for {wsKey.charAt(0).toUpperCase() + wsKey.slice(1)}
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary" }}>
                                        No transcript data was found.
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary" }}>
                                        This usually means the database was cleared
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary" }}>
                                        or there has been no streams in the past week.
                                    </Typography>
                                </>
                            )}
                        </Box>
                    ) : (
                        <Box
                            className={containerHeightClass}
                            sx={{
                                display: "flex",
                                flexDirection: "column",

                                bgcolor: "background.default",
                            }}
                        >
                            <Box sx={{ flexShrink: 0 }}>
                                {serverStatus === "reconnecting" && <ConnectionBanner />}
                                <LineMenu wsKey={wsKey} jumpToLine={jumpToLine} linkBase={linkBase} />
                                {showTitle && <ViewTitleSelection />}
                                {!isHeaderMinimized && isLive && devMode && (
                                    <DevHeaderInfo startTime={activeStartTime} />
                                )}
                                {isOutOfSync && (
                                    <Box sx={{ p: 2, pb: 0 }}>
                                        <Typography color="warning.main" sx={{ fontWeight: "bold" }}>
                                            The current transcript is out of sync. Refresh to fix it.
                                        </Typography>
                                    </Box>
                                )}
                                {(activeTranscript.length > 0 || showPastStreamLoading) && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1,
                                            width: "100%",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 1,
                                            mt: 2,
                                        }}
                                    >
                                        <TextField
                                            inputRef={searchInputRef}
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
                                                    endAdornment: searchTerm ? (
                                                        <InputAdornment position="end">
                                                            {isFiltering && (
                                                                <Typography
                                                                    variant="caption"
                                                                    aria-live="polite"
                                                                    data-testid="search-match-count"
                                                                    sx={{
                                                                        mr: 0.5,
                                                                        whiteSpace: "nowrap",
                                                                        color: "text.secondary",
                                                                        fontVariantNumeric: "tabular-nums",
                                                                    }}
                                                                >
                                                                    {displayData.length} / {activeTranscript.length}
                                                                </Typography>
                                                            )}
                                                            <IconButton
                                                                size="small"
                                                                edge="end"
                                                                onClick={handleClearSearch}
                                                                aria-label="clear search"
                                                                data-testid="clear-search"
                                                            >
                                                                <Clear fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ) : null,
                                                },
                                            }}
                                            sx={{ flex: isMobile ? "1 1 200px" : "0 1 50%" }}
                                        />
                                        <Tooltip title={clipMode ? "Exit Clip Mode" : "Enter Clip Mode"}>
                                            <Button
                                                data-testid="clip-mode-button"
                                                onClick={toggleClipMode}
                                                color={clipMode ? "secondary" : "primary"}
                                                variant={clipMode ? "contained" : "text"}
                                                startIcon={<ContentCut />}
                                                size="small"
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {isMobile ? "Clip" : "Clip Mode"}
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={isHeaderMinimized ? "Show Header" : "Minimize Header"}>
                                            <IconButton
                                                onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
                                                aria-label={isHeaderMinimized ? "Show header" : "Minimize header"}
                                                aria-expanded={!isHeaderMinimized}
                                            >
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
                                            variant={isMobile ? "fullWidth" : "scrollable"}
                                            scrollButtons="auto"
                                            aria-label="Transcript layout"
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
                                                                display: { xs: "none", sm: "block" },
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
                                                                display: { xs: "none", sm: "block" },
                                                            }}
                                                        >
                                                            Pauses when scrolling
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ minHeight: "48px", py: 1, minWidth: "auto", px: 2 }}
                                            />
                                            {activeMediaType === "video" && (
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
                                                                    display: { xs: "none", sm: "block" },
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
                                <Divider />
                            </Box>
                            {pastStreamError ? (
                                <Box
                                    className={containerHeightClass}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                    }}
                                >
                                    <Typography variant="h6" color="error" gutterBottom>
                                        Error Loading Transcript
                                    </Typography>
                                    <Typography variant="body1">{pastStreamError}</Typography>
                                </Box>
                            ) : showPastStreamLoading ? (
                                // The header (title picker, search, tabs) stays put while a past stream loads.
                                <TranscriptSkeleton />
                            ) : (
                                renderContent()
                            )}
                        </Box>
                    )}
                </>
            )}
        </>
    );
}
