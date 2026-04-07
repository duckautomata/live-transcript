import { useState, useEffect, useMemo } from "react";
import { Box, Typography, CircularProgress, Divider, Alert, Chip, Stack, Paper, Fade } from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useAppStore } from "../../store/store";
import { parseCSV, parsePTtoUTC, formatLocalTime, formatPTTime, formatDuration } from "../../logic/schedule";
// import dokiCSV from "../../assets/doki.csv?url";

/**
 * @typedef {Object} CsvRow
 * @property {string} stream_id
 * @property {string} stream_name
 * @property {string} platform
 * @property {string} stream_date_pt
 * @property {string} stream_time_pt
 */

/**
 * @typedef {Object} StreamInfo
 * @property {Date | null} startUTC
 * @property {string} stream_id
 * @property {string} stream_name
 * @property {string} platform
 */

// ---------------------------------------------------------------------------
// Styled Components & Helpers
// ---------------------------------------------------------------------------

const StyledPaper = ({ children, statusColor, ...props }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "4px",
                backgroundColor: statusColor || "transparent",
            },
            ...props.sx,
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
            <Stack direction="row" spacing={1} alignItems="center">
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
                {value || "—"}
            </Typography>
        </Box>
    );
}

/**
 * Shows how late/early the current or most recent stream started.
 * @param {object} props
 * @param {string} props.activeStream - The active stream object.
 * @param {Date} props.scheduledStartUTC - The scheduled start time in UTC.
 * @param {number} props.startTimeFromStore - The actual start time in seconds since epoch.
 */
function LatenessCard({ activeStream, scheduledStartUTC, startTimeFromStore }) {
    const ON_TIME_THRESHOLD_MS = 60 * 1000;

    if (!startTimeFromStore) {
        return (
            <StyledPaper statusColor="text.disabled">
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
            <StyledPaper statusColor="primary.main">
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
    const isOnTime = absMs < ON_TIME_THRESHOLD_MS;
    const isLate = latenessMs > 0;

    const statusLabel = isOnTime ? "On Schedule" : isLate ? "Started Late by" : "Started Early by";
    const statusColor = isOnTime ? "success.main" : isLate ? "error.main" : "info.main";
    const onTimeNotion = isLate ? "+" : "-";

    return (
        <StyledPaper statusColor={statusColor}>
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
 * @param {StreamInfo} props.nextStream - The next stream object.
 * @param {number} props.currentTime - The current time in seconds since epoch.
 */
function CountdownCard({ nextStream, currentTime }) {
    const diffMs = nextStream.startUTC - currentTime;
    const absDiffMs = Math.abs(diffMs);
    const isPast = diffMs < 0;
    const isLate = isPast && absDiffMs >= 60000;

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
        <StyledPaper statusColor={statusColor}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
        <StyledPaper statusColor="text.disabled">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Tracker = ({ wsKey }) => {
    /** @type {[CsvRow[], (csvData: CsvRow[]) => void]} */
    const [csvData, setCsvData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const currentStreamIdFromStore = useAppStore((state) => state.streamId);
    const isLive = useAppStore((state) => state.isLive); // boolean
    const startTimeFromStore = useAppStore((state) => state.startTime); // Unix timestamp in seconds
    const pastStreamsIds = useAppStore((state) => state.pastStreams).map((stream) => stream.streamId);

    // Fetch CSV on mount and every hour
    useEffect(() => {
        const fetchData = () => {
            const csvUrl = `https://content.duck-automata.com/live-transcript/${wsKey}.csv`;
            fetch(csvUrl)
                .then((r) => {
                    if (!r.ok) throw new Error("fetch failed");
                    return r.text();
                })
                .then((text) => {
                    const parsed = parseCSV(text);
                    if (parsed.length === 0) throw new Error("empty");
                    setCsvData(parsed);
                    setLoading(false);
                    setError(false);
                })
                .catch(() => {
                    setError(true);
                    setLoading(false);
                });
        };

        fetchData();

        const intervalId = setInterval(fetchData, 15 * 60 * 1000); // 15 minutes
        return () => clearInterval(intervalId);
    }, [wsKey]);

    // Tick every second for live countdown / lateness display
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // Process CSV rows once to add startUTC
    const processedStreams = useMemo(() => {
        return csvData.map((row) => ({
            ...row,
            startUTC: parsePTtoUTC(row.stream_date_pt, row.stream_time_pt),
        }));
    }, [csvData]);

    // CSV row that matches the current stream id (used when live)
    const matchedStream = useMemo(() => {
        return processedStreams.find(
            (row) => row.stream_id && String(row.stream_id) === String(currentStreamIdFromStore),
        );
    }, [processedStreams, currentStreamIdFromStore]);

    // scheduled stream that doesn't have a stream_id but is close to the current start time (within 2 hours)
    const partialMatchStream = useMemo(() => {
        return processedStreams.find(
            (row) =>
                row.stream_id === "" &&
                row.startUTC &&
                row.startUTC.getTime() - 2 * 3600 * 1000 <= startTimeFromStore * 1000 &&
                row.startUTC.getTime() + 2 * 3600 * 1000 >= startTimeFromStore * 1000, // 2 hours buffer
        );
    }, [processedStreams, startTimeFromStore]);

    // The stream whose lateness we display (either current live or just ended)
    // We accept a partial match since I may forget to add the stream_id to the CSV once the waiting room is up.
    const activeStream = matchedStream ?? partialMatchStream;
    const scheduledStartUTC = activeStream?.startUTC ?? null;

    // Next upcoming stream within 12 hours (only checked when offline)
    const nextStream = useMemo(() => {
        if (isLive) return null;
        const now = currentTime;
        return (
            processedStreams
                .filter((s) => {
                    if (!s.startUTC) return false;
                    const diff = s.startUTC - now;
                    return diff > 0 && diff <= 12 * 3600 * 1000;
                })
                .sort((a, b) => a.startUTC - b.startUTC)[0] ?? null
        );
    }, [isLive, processedStreams, currentTime]);

    // Previous stream within 12 hours (only checked when offline)
    const previousStream = useMemo(() => {
        if (isLive) return null;
        const now = currentTime;
        return (
            processedStreams
                .filter((s) => {
                    if (!s.startUTC) return false;
                    const diff = s.startUTC - now;
                    return diff < 0 && diff >= -12 * 3600 * 1000;
                })
                .sort((a, b) => b.startUTC - a.startUTC)[0] ?? null
        );
    }, [isLive, processedStreams, currentTime]);

    // Display logic:
    //   Countdown  → offline AND
    //      ((next stream within 12h AND next stream is not the current stream or past stream) OR
    //      (previous stream within 12h AND previous stream is not the current stream or past stream))
    //   Lateness   → (live AND matched) OR (offline AND no countdown)
    //   Fallback   → Otherwise
    const nextStreamValid =
        nextStream !== null &&
        nextStream.stream_id !== currentStreamIdFromStore &&
        !pastStreamsIds.includes(nextStream.stream_id);
    const previousStreamValid =
        previousStream !== null &&
        previousStream.stream_id !== currentStreamIdFromStore &&
        !pastStreamsIds.includes(previousStream.stream_id);
    const showCountdown = !isLive && (nextStreamValid || previousStreamValid);
    const showLateness = (isLive && matchedStream !== null) || (!isLive && !showCountdown);
    const showFallback = !showCountdown && !showLateness;

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

    return (
        <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
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
                        Could not load stream schedule data. Please try again later.
                    </Alert>
                </Fade>
            )}

            {!loading && !error && (
                <Fade in timeout={600}>
                    <Box>
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
                </Fade>
            )}
        </Box>
    );
};

export default Tracker;
