import { useState, useEffect, useMemo } from "react";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Divider,
    Fade,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { BarChart } from "@mui/x-charts";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import TimelineIcon from "@mui/icons-material/Timeline";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import SpeedIcon from "@mui/icons-material/Speed";
import { useAppStore } from "../../store/store";
import {
    ON_TIME_THRESHOLD_MS,
    buildLatenessRecords,
    formatDuration,
    formatLocalTime,
    formatPTTime,
    formatShortDate,
    formatSignedDuration,
    latenessCategory,
    mergeLatenessRecords,
    parseCSV,
    parsePTtoUTC,
    summarizeLateness,
} from "../../logic/schedule";
import { SCHEDULE_MOCK_OFF, buildMockScheduleCsv } from "../../logic/scheduleMock";

/**
 * @typedef {import("../../logic/schedule").CsvRow} CsvRow
 * @typedef {import("../../logic/schedule").ScheduledStream} ScheduledStream
 * @typedef {import("../../logic/schedule").LatenessRecord} LatenessRecord
 */

/** How often the schedule CSV is re-fetched. */
const CSV_REFRESH_MS = 15 * 60 * 1000;
/** How far ahead/behind we look for a stream to count down to. */
const COUNTDOWN_WINDOW_MS = 12 * 60 * 60 * 1000;
/** A schedule row without a stream id still matches a stream starting this close to it. */
const PARTIAL_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;
/** Most recent streams plotted on the chart. */
const MAX_CHART_POINTS = 30;

// ---------------------------------------------------------------------------
// Styled Components & Helpers
// ---------------------------------------------------------------------------

const StyledPaper = ({ children, sx, ...props }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            ...sx,
        }}
        {...props}
    >
        {children}
    </Paper>
);

function StatusChip({ isLive }) {
    return (
        <Chip
            size="small"
            data-testid="tracker-status-chip"
            label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                        {isLive ? "Live" : "Offline"}
                    </Typography>
                </Box>
            }
            color={isLive ? "error" : "default"}
            variant={isLive ? "filled" : "outlined"}
            sx={{
                height: 24,
                px: 0.5,
                backgroundColor: isLive ? "error.main" : "transparent",
                "& .MuiChip-label": { px: 1 },
            }}
        />
    );
}

function InfoRow({ label, value, icon: Icon }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {Icon && <Icon sx={{ fontSize: 16, color: "text.secondary" }} />}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}
                >
                    {label}
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                {value || "⊗︎"}
            </Typography>
        </Box>
    );
}

/**
 * Small metric tile used in the punctuality summary grid.
 */
function StatTile({ title, value, caption, icon: Icon, color }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                {Icon && <Icon sx={{ fontSize: 18, color: color ?? "text.secondary" }} />}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}
                >
                    {title}
                </Typography>
            </Stack>
            <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: color ?? "text.primary", fontVariantNumeric: "tabular-nums" }}
            >
                {value}
            </Typography>
            {caption && (
                <Typography variant="caption" color="text.secondary">
                    {caption}
                </Typography>
            )}
        </Paper>
    );
}

/**
 * Shows how late/early the current or most recent stream started.
 * @param {object} props
 * @param {ScheduledStream} props.activeStream - The active stream object.
 * @param {Date} props.scheduledStartUTC - The scheduled start time in UTC.
 * @param {number} props.startTimeFromStore - The actual start time in seconds since epoch.
 */
function LatenessCard({ activeStream, scheduledStartUTC, startTimeFromStore }) {
    if (!startTimeFromStore) {
        return (
            <StyledPaper>
                <Typography variant="overline" color="text.secondary">
                    Stream Start
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Waiting for stream start time…
                </Typography>
            </StyledPaper>
        );
    }

    if (!scheduledStartUTC) {
        return (
            <StyledPaper>
                <Typography variant="overline" color="text.secondary">
                    Stream Start
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No scheduled time found for this stream.
                </Typography>
                <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                <InfoRow
                    label="Actual Start"
                    value={formatLocalTime(new Date(startTimeFromStore * 1000))}
                    icon={AccessTimeIcon}
                />
            </StyledPaper>
        );
    }

    const latenessMs = startTimeFromStore * 1000 - scheduledStartUTC.getTime();
    const absMs = Math.abs(latenessMs);
    const category = latenessCategory(latenessMs);
    const isOnTime = category === "onTime";
    const isLate = category === "late";

    const statusLabel = isOnTime ? "On Schedule" : isLate ? "Started Late by" : "Started Early by";
    const statusColor = isOnTime ? "success.main" : isLate ? "error.main" : "info.main";
    const onTimeNotion = latenessMs > 0 ? "+" : "-";

    return (
        <StyledPaper data-testid="tracker-lateness-card">
            <Typography variant="overline" sx={{ color: statusColor, fontWeight: 800, letterSpacing: "0.1em" }}>
                {statusLabel}
            </Typography>

            <Typography
                variant="h2"
                sx={{
                    fontWeight: 900,
                    color: statusColor,
                    lineHeight: 1,
                    mt: 0.5,
                    mb: 1,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.02em",
                }}
            >
                {isOnTime ? `${onTimeNotion}${formatDuration(absMs)}` : `${formatDuration(absMs)}`}
            </Typography>

            <Divider sx={{ my: 2, opacity: 0.6 }} />

            <Stack spacing={0.5}>
                {activeStream && (
                    <>
                        <InfoRow label="Stream" value={activeStream.stream_name} icon={WifiIcon} />
                        <InfoRow label="Platform" value={activeStream.platform} />
                    </>
                )}
                <InfoRow label="Scheduled" value={formatLocalTime(scheduledStartUTC)} icon={AccessTimeIcon} />
                <InfoRow
                    label="Actual"
                    value={formatLocalTime(new Date(startTimeFromStore * 1000))}
                    icon={AccessTimeIcon}
                />
            </Stack>
        </StyledPaper>
    );
}

/**
 * Countdown to the next stream. Or countup how long ago the stream should have started.
 * @param {object} props
 * @param {ScheduledStream} props.nextStream - The next stream object.
 * @param {number} props.currentTime - The current time in ms since epoch.
 */
function CountdownCard({ nextStream, currentTime }) {
    const diffMs = nextStream.startUTC.getTime() - currentTime;
    const absDiffMs = Math.abs(diffMs);
    const isPast = diffMs < 0;
    const isLate = isPast && absDiffMs >= ON_TIME_THRESHOLD_MS;

    let label = "Next Stream In";
    let statusColor = "primary.main";
    let displayValue = formatDuration(absDiffMs);

    if (isLate) {
        label = "Stream is Late by";
        statusColor = "error.main";
    } else if (isPast) {
        label = "Starting Soon";
        displayValue = `${Math.floor(absDiffMs / 1000)}s past`;
    }

    return (
        <StyledPaper data-testid="tracker-countdown-card">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                <AccessTimeIcon fontSize="small" sx={{ color: statusColor }} />
                <Typography variant="overline" sx={{ color: statusColor, fontWeight: 800, letterSpacing: "0.1em" }}>
                    {label}
                </Typography>
            </Stack>

            <Typography
                variant="h2"
                sx={{
                    fontWeight: 900,
                    color: statusColor,
                    lineHeight: 1,
                    mt: 0.5,
                    mb: 1,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.02em",
                }}
            >
                {displayValue}
            </Typography>

            <Divider sx={{ my: 2, opacity: 0.6 }} />

            <Stack spacing={0.5}>
                <InfoRow label="Stream" value={nextStream.stream_name} icon={WifiIcon} />
                <InfoRow label="Platform" value={nextStream.platform} />
                <InfoRow label="Local Time" value={formatLocalTime(nextStream.startUTC)} icon={AccessTimeIcon} />
                <InfoRow label="Pacific Time" value={`${formatPTTime(nextStream.startUTC)} PT`} />
            </Stack>

            <Divider sx={{ mt: 3, mb: 1, opacity: 0.4 }} />
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    display: "block",
                    fontStyle: "italic",
                    textAlign: "center",
                    opacity: 0.7,
                    lineHeight: 1.4,
                }}
            >
                Note: This assumes your device&apos;s clock is in sync with YouTube&apos;s servers. Once the stream
                starts, the official YouTube timestamp will be used instead.
            </Typography>
        </StyledPaper>
    );
}

/**
 * Fallback card when no scheduled stream matches.
 */
function NoStreamCard({ isLive, startTimeFromStore }) {
    const label = isLive ? "Current session" : "Last session";
    const date = startTimeFromStore ? new Date(startTimeFromStore * 1000) : null;

    return (
        <StyledPaper data-testid="tracker-no-stream-card">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                <WifiOffIcon fontSize="small" sx={{ color: "text.disabled" }} />
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                    No Scheduled Events
                </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, lineHeight: 1.6 }}>
                {isLive
                    ? "A stream is currently live but isn't listed in the official schedule."
                    : "There are no streams scheduled within the next 12 hours."}
            </Typography>

            <Divider sx={{ mb: 2, opacity: 0.6 }} />

            {date ? (
                <InfoRow label={label} value={formatLocalTime(date)} icon={AccessTimeIcon} />
            ) : (
                <Typography variant="caption" color="text.disabled">
                    No recent session data available.
                </Typography>
            )}
        </StyledPaper>
    );
}

/**
 * Punctuality metrics + chart over every stream we have both a scheduled and an
 * actual start time for.
 * @param {object} props
 * @param {LatenessRecord[]} props.records - Oldest first.
 */
function PunctualitySection({ records }) {
    const theme = useTheme();
    const isMobile = useMediaQuery("(max-width:768px)");
    const summary = useMemo(() => summarizeLateness(records), [records]);

    const categoryColor = {
        early: theme.palette.info.main,
        onTime: theme.palette.success.main,
        late: theme.palette.error.main,
    };

    const chartRecords = useMemo(() => records.slice(-MAX_CHART_POINTS), [records]);
    // A band scale keys by value, so two streams on the same day would collapse into
    // one band and shift every later bar out from under its own hit area. Index the
    // bands instead and render the date through the formatter.
    const chartBands = chartRecords.map((_, index) => index);
    const formatBand = (index) => formatShortDate(chartRecords[index]?.scheduledMs);
    // Minutes read better than milliseconds on the axis; the tooltip keeps the exact value.
    const chartData = chartRecords.map((r) => (r.actualMs - r.scheduledMs) / 60000);

    const tableRows = useMemo(() => [...records].reverse(), [records]);

    if (records.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: "center" }}>
                <TimelineIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                    No data yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Metrics appear once a stream in the schedule can be matched to a stream the server has actually
                    seen. History builds up as more streams go live.
                </Typography>
            </Paper>
        );
    }

    const meanCategory = latenessCategory(summary.meanMs);
    const medianCategory = latenessCategory(summary.medianMs);

    return (
        <Stack spacing={3}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatTile
                        title="Streams tracked"
                        value={summary.count}
                        caption={`${summary.earlyCount} early · ${summary.onTimeCount} on time · ${summary.lateCount} late`}
                        icon={EventAvailableIcon}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatTile
                        title="Average"
                        value={formatSignedDuration(summary.meanMs)}
                        caption={
                            meanCategory === "late"
                                ? "typically late"
                                : meanCategory === "early"
                                  ? "typically early"
                                  : "typically on time"
                        }
                        icon={SpeedIcon}
                        color={categoryColor[meanCategory]}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatTile
                        title="Median"
                        value={formatSignedDuration(summary.medianMs)}
                        caption="less skewed by outliers"
                        icon={TimelineIcon}
                        color={categoryColor[medianCategory]}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatTile
                        title="On-time rate"
                        value={`${Math.round(summary.onTimeRate * 100)}%`}
                        caption={`within ${formatDuration(ON_TIME_THRESHOLD_MS)} of schedule`}
                        icon={HourglassBottomIcon}
                        color={summary.onTimeRate >= 0.5 ? categoryColor.onTime : undefined}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatTile
                        title="Worst start"
                        value={formatSignedDuration(summary.worstMs)}
                        caption="furthest from schedule"
                        icon={AccessTimeIcon}
                        color={categoryColor[latenessCategory(summary.worstMs)]}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatTile
                        title="Best start"
                        value={formatSignedDuration(summary.bestMs)}
                        caption="closest to schedule"
                        icon={AccessTimeIcon}
                        color={categoryColor[latenessCategory(summary.bestMs)]}
                    />
                </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: { xs: 1, md: 2 }, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, px: 1 }}>
                    Start delay per stream (minutes)
                </Typography>
                <BarChart
                    height={isMobile ? 260 : 340}
                    xAxis={[
                        {
                            data: chartBands,
                            scaleType: "band",
                            valueFormatter: formatBand,
                            tickLabelStyle: { fontSize: 11 },
                        },
                    ]}
                    yAxis={[
                        {
                            label: "minutes",
                            colorMap: {
                                type: "piecewise",
                                // Thresholds are the on-time window expressed in minutes.
                                thresholds: [-ON_TIME_THRESHOLD_MS / 60000, ON_TIME_THRESHOLD_MS / 60000],
                                colors: [categoryColor.early, categoryColor.onTime, categoryColor.late],
                            },
                        },
                    ]}
                    series={[
                        {
                            data: chartData,
                            label: "Delay",
                            valueFormatter: (value) => (value === null ? "⊗︎" : formatSignedDuration(value * 60000)),
                        },
                    ]}
                    hideLegend
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                />
                {records.length > MAX_CHART_POINTS && (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                        Showing the {MAX_CHART_POINTS} most recent of {records.length} tracked streams.
                    </Typography>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                {/* Every tracked stream is listed. On desktop the container scrolls once the list
                    gets long; on mobile it grows with the page instead, since a nested scroll area
                    with a sticky header just leaves a sliver of the row above bleeding under it. */}
                <TableContainer sx={{ maxHeight: isMobile ? "none" : 520 }}>
                    <Table
                        stickyHeader={!isMobile}
                        size="small"
                        data-testid="tracker-history-table"
                        // MUI paints sticky header cells with background.default, which this theme
                        // leaves at the MUI default and so does not match the surrounding Paper.
                        sx={{ "& thead th": { backgroundColor: "background.paper" } }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Stream</TableCell>
                                <TableCell>Scheduled</TableCell>
                                <TableCell>Actual</TableCell>
                                <TableCell align="right">Delay</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tableRows.map((record) => {
                                const delta = record.actualMs - record.scheduledMs;
                                return (
                                    <TableRow key={record.streamId}>
                                        <TableCell>{formatShortDate(record.scheduledMs)}</TableCell>
                                        <TableCell
                                            sx={{
                                                maxWidth: 280,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <Tooltip title={record.streamName}>
                                                <span>{record.streamName || record.streamId}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{formatLocalTime(new Date(record.scheduledMs))}</TableCell>
                                        <TableCell>{formatLocalTime(new Date(record.actualMs))}</TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                fontVariantNumeric: "tabular-nums",
                                                color: categoryColor[latenessCategory(delta)],
                                            }}
                                        >
                                            {formatSignedDuration(delta)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Stack>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Tracker = ({ wsKey }) => {
    /** @type {[CsvRow[], (csvData: CsvRow[]) => void]} */
    const [csvData, setCsvData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const isMobile = useMediaQuery("(max-width:768px)");

    const currentStreamIdFromStore = useAppStore((state) => state.streamId);
    const isLive = useAppStore((state) => state.isLive); // boolean
    const startTimeFromStore = useAppStore((state) => state.startTime); // Unix timestamp in seconds
    const pastStreams = useAppStore((state) => state.pastStreams);
    const storedHistory = useAppStore((state) => state.latenessHistory[wsKey]);
    const addLatenessRecords = useAppStore((state) => state.addLatenessRecords);
    const devMode = useAppStore((state) => state.devMode);
    const scheduleMock = useAppStore((state) => state.scheduleMock);

    // Dev Tools can swap the fetched schedule for a generated one.
    const mockActive = devMode && scheduleMock !== SCHEDULE_MOCK_OFF;

    const pastStreamsIds = useMemo(() => pastStreams.map((stream) => stream.streamId), [pastStreams]);

    // Fetch CSV on mount and periodically
    useEffect(() => {
        if (mockActive) return undefined;
        let cancelled = false;

        const fetchData = () => {
            const csvUrl = `https://content.duck-automata.com/live-transcript/${wsKey}.csv`;
            fetch(csvUrl)
                .then((r) => {
                    if (!r.ok) throw new Error("fetch failed");
                    return r.text();
                })
                .then((text) => {
                    if (cancelled) return;
                    const parsed = parseCSV(text);
                    if (parsed.length === 0) throw new Error("empty");
                    setCsvData(parsed);
                    setLoading(false);
                    setError(false);
                })
                .catch(() => {
                    if (cancelled) return;
                    setCsvData([]);
                    setError(true);
                    setLoading(false);
                });
        };

        setLoading(true);
        fetchData();

        const intervalId = setInterval(fetchData, CSV_REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [wsKey, mockActive]);

    // Dev Tools scenario. Regenerated only when the scenario or the active stream
    // changes, so a countdown stays anchored to the moment it was selected and
    // actually ticks down rather than being reset every render.
    useEffect(() => {
        if (!mockActive) return;

        const csv = buildMockScheduleCsv(scheduleMock, {
            now: Date.now(),
            streamId: currentStreamIdFromStore,
            startTime: startTimeFromStore,
        });

        setCsvData(parseCSV(csv));
        setLoading(false);
        // A scenario that needs an active stream but has none yields empty text;
        // surface that as an error rather than an unexplained empty page.
        setError(csv === "");
    }, [mockActive, scheduleMock, currentStreamIdFromStore, startTimeFromStore]);

    // Tick every second for live countdown / lateness display
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // Process CSV rows once to add startUTC
    /** @type {ScheduledStream[]} */
    const processedStreams = useMemo(() => {
        return csvData.map((row) => ({
            ...row,
            startUTC: parsePTtoUTC(row.stream_date_pt, row.stream_time_pt),
        }));
    }, [csvData]);

    // CSV row that matches the current stream id (used when live)
    const matchedStream = useMemo(() => {
        if (!currentStreamIdFromStore) return undefined;
        return processedStreams.find(
            (row) => row.stream_id && String(row.stream_id) === String(currentStreamIdFromStore),
        );
    }, [processedStreams, currentStreamIdFromStore]);

    // scheduled stream that doesn't have a stream_id but is close to the current start time (within 2 hours)
    const partialMatchStream = useMemo(() => {
        if (!startTimeFromStore) return undefined;
        const startMs = startTimeFromStore * 1000;
        return processedStreams.find(
            (row) =>
                row.stream_id === "" &&
                row.startUTC &&
                row.startUTC.getTime() - PARTIAL_MATCH_WINDOW_MS <= startMs &&
                row.startUTC.getTime() + PARTIAL_MATCH_WINDOW_MS >= startMs,
        );
    }, [processedStreams, startTimeFromStore]);

    // The stream whose lateness we display (either current live or just ended)
    // We accept a partial match since I may forget to add the stream_id to the CSV once the waiting room is up.
    const activeStream = matchedStream ?? partialMatchStream;
    const scheduledStartUTC = activeStream?.startUTC ?? null;

    // Actual start times we currently know about, keyed by stream id.
    const actualStartsMs = useMemo(() => {
        const map = new Map();
        pastStreams.forEach((stream) => {
            const startTime = Number(stream?.startTime);
            if (stream?.streamId && startTime > 0) {
                map.set(String(stream.streamId), startTime * 1000);
            }
        });
        if (currentStreamIdFromStore && startTimeFromStore > 0) {
            map.set(String(currentStreamIdFromStore), startTimeFromStore * 1000);
        }
        return map;
    }, [pastStreams, currentStreamIdFromStore, startTimeFromStore]);

    // Records derivable right now from the schedule + what the server has cached.
    const liveRecords = useMemo(() => {
        const records = buildLatenessRecords(processedStreams, actualStartsMs);

        // The active stream may have matched a schedule row that has no stream id
        // yet. We know the real id from the store, so record it under that id.
        if (!matchedStream && partialMatchStream?.startUTC && currentStreamIdFromStore && startTimeFromStore > 0) {
            const partialWithId = {
                ...partialMatchStream,
                stream_id: currentStreamIdFromStore,
            };
            records.push(...buildLatenessRecords([partialWithId], actualStartsMs));
        }

        return records;
    }, [
        processedStreams,
        actualStartsMs,
        matchedStream,
        partialMatchStream,
        currentStreamIdFromStore,
        startTimeFromStore,
    ]);

    // The server only caches a few past streams, so remember what we have seen.
    // Mocked schedules are shown but never saved, so playing with Dev Tools
    // scenarios cannot corrupt the real punctuality history.
    useEffect(() => {
        if (!mockActive && liveRecords.length > 0) {
            addLatenessRecords(wsKey, liveRecords);
        }
    }, [wsKey, liveRecords, addLatenessRecords, mockActive]);

    const allRecords = useMemo(
        () => mergeLatenessRecords(storedHistory ?? [], liveRecords),
        [storedHistory, liveRecords],
    );

    // Next upcoming stream within 12 hours (only checked when offline)
    const nextStream = useMemo(() => {
        if (isLive) return null;
        return (
            processedStreams
                .filter((s) => {
                    if (!s.startUTC) return false;
                    const diff = s.startUTC.getTime() - currentTime;
                    return diff > 0 && diff <= COUNTDOWN_WINDOW_MS;
                })
                .sort((a, b) => a.startUTC - b.startUTC)[0] ?? null
        );
    }, [isLive, processedStreams, currentTime]);

    // Previous stream within 12 hours (only checked when offline)
    const previousStream = useMemo(() => {
        if (isLive) return null;
        return (
            processedStreams
                .filter((s) => {
                    if (!s.startUTC) return false;
                    const diff = s.startUTC.getTime() - currentTime;
                    return diff < 0 && diff >= -COUNTDOWN_WINDOW_MS;
                })
                .sort((a, b) => b.startUTC - a.startUTC)[0] ?? null
        );
    }, [isLive, processedStreams, currentTime]);

    // Display logic:
    //   Countdown → offline AND a scheduled stream within 12h that has not aired yet
    //   Lateness  → we matched a schedule row (the card itself handles a missing start time)
    //   Fallback  → otherwise, i.e. the stream is not in the schedule at all
    const nextStreamValid =
        nextStream !== null &&
        nextStream.stream_id !== currentStreamIdFromStore &&
        !pastStreamsIds.includes(nextStream.stream_id);
    const previousStreamValid =
        previousStream !== null &&
        previousStream.stream_id !== currentStreamIdFromStore &&
        !pastStreamsIds.includes(previousStream.stream_id);

    // choose the one closest to current time
    const countdownStream =
        nextStreamValid && previousStreamValid
            ? Math.abs(nextStream.startUTC - currentTime) < Math.abs(previousStream.startUTC - currentTime)
                ? nextStream
                : previousStream
            : nextStreamValid
              ? nextStream
              : previousStreamValid
                ? previousStream
                : null;

    const showCountdown = !isLive && countdownStream !== null;
    const showLateness = !showCountdown && Boolean(activeStream);
    const showFallback = !showCountdown && !showLateness;

    return (
        // #root is centered globally, so textAlign opts this page back into normal alignment.
        <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1100, mx: "auto", textAlign: "left" }} data-testid="tracker-page">
            {/* Leave room for the floating hamburger button on mobile. */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3, pl: isMobile ? 6 : 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                    Stream Tracker
                </Typography>
                <StatusChip isLive={isLive} />
            </Stack>

            {loading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 4, justifyContent: "center" }}>
                    <CircularProgress size={20} thickness={5} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Synchronizing schedule…
                    </Typography>
                </Box>
            )}

            {!loading && error && (
                <Fade in>
                    <Alert
                        severity="error"
                        icon={<ErrorOutlineIcon />}
                        sx={{ borderRadius: 3, "& .MuiAlert-message": { fontWeight: 500 } }}
                    >
                        Could not load the stream schedule for this streamer. Punctuality metrics are unavailable
                        without it.
                    </Alert>
                </Fade>
            )}

            {!loading && !error && (
                <Fade in timeout={600}>
                    <Stack spacing={4}>
                        {/* Full width on mobile, centred at a readable width on desktop. Stack resets
                            margins on its direct children, so centre with alignSelf rather than mx. */}
                        <Box sx={{ width: "100%", maxWidth: { xs: "100%", md: 520 }, alignSelf: "center" }}>
                            {showCountdown && <CountdownCard nextStream={countdownStream} currentTime={currentTime} />}
                            {showLateness && (
                                <LatenessCard
                                    activeStream={activeStream}
                                    scheduledStartUTC={scheduledStartUTC}
                                    startTimeFromStore={startTimeFromStore}
                                />
                            )}
                            {showFallback && <NoStreamCard isLive={isLive} startTimeFromStore={startTimeFromStore} />}
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: "-0.02em" }}>
                                Punctuality
                            </Typography>
                            <PunctualitySection records={allRecords} />
                        </Box>
                    </Stack>
                </Fade>
            )}
        </Box>
    );
};

export default Tracker;
