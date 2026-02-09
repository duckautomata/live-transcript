import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    Tabs,
    Tab,
    IconButton,
    Grid,
    Paper,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import { Add, Delete, PlayArrow, Stop } from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useAppStore } from "../store/store";

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

export default function DevToolsPopup({ open, setOpen }) {
    const [tabValue, setTabValue] = useState(0);

    // Store Access
    const transcript = useAppStore((state) => state.transcript);
    const resetTranscript = useAppStore((state) => state.resetTranscript);
    const addTranscriptLine = useAppStore((state) => state.addTranscriptLine);
    const updateLineMedia = useAppStore((state) => state.updateLineMedia);
    const recalculateClipRange = useAppStore((state) => state.recalculateClipRange);
    const setTranscript = useAppStore((state) => state.setTranscript);
    const metrics = useAppStore((state) => state.metrics);
    const clearMetrics = useAppStore((state) => state.clearMetrics);
    const pastStreamViewing = useAppStore((state) => state.pastStreamViewing);
    const streamId = useAppStore((state) => state.streamId);
    const selectedId = pastStreamViewing || streamId;

    const streamTitle = useAppStore((state) => state.streamTitle);
    const setStreamTitle = useAppStore((state) => state.setStreamTitle);
    const startTime = useAppStore((state) => state.startTime);
    const setStartTime = useAppStore((state) => state.setStartTime);
    const mediaType = useAppStore((state) => state.mediaType);
    const setMediaType = useAppStore((state) => state.setMediaType);
    const isLive = useAppStore((state) => state.isLive);
    const setIsLive = useAppStore((state) => state.setIsLive);

    // Simulation State
    const [lineId, setLineId] = useState("");
    const [lineTimestamp, setLineTimestamp] = useState("");
    const [segments, setSegments] = useState([{ text: "", timestamp: "" }]);
    const [deleteId, setDeleteId] = useState("");
    const [simStartId, setSimStartId] = useState(1);
    const [simInterval, setSimInterval] = useState(1000);
    const [isSimulating, setIsSimulating] = useState(false);

    // Media Availability State
    const [mediaIds, setMediaIds] = useState("");
    const [mediaAvailable, setMediaAvailable] = useState(true);

    // Performance Metrics State
    const [fps, setFps] = useState(0);
    const [memory, setMemory] = useState({ used: 0, total: 0 });

    // Handlers
    const handleClose = () => setOpen(false);
    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const handleClearTranscript = () => {
        resetTranscript();
        clearMetrics();
    };

    const handleAddSegment = () => {
        setSegments([...segments, { text: "", timestamp: "" }]);
    };

    const handleSegmentChange = (index, field, value) => {
        const newSegments = [...segments];
        newSegments[index][field] = value;
        setSegments(newSegments);
    };

    const handleRemoveSegment = (index) => {
        const newSegments = segments.filter((_, i) => i !== index);
        setSegments(newSegments);
    };

    const handleAddLine = () => {
        const id = parseInt(lineId);
        const timestamp = parseInt(lineTimestamp) || Math.floor(Date.now() / 1000);
        const formattedSegments = segments.map((seg) => ({
            text: seg.text,
            timestamp: parseInt(seg.timestamp) || timestamp,
        }));

        if (!isNaN(id)) {
            addTranscriptLine({
                id,
                timestamp,
                segments: formattedSegments,
            });
            setLineId(String(id + 1));
        }
    };

    const handleDeleteLine = () => {
        const idToDelete = parseInt(deleteId);
        if (!isNaN(idToDelete)) {
            const newTranscript = transcript.filter((line) => line.id !== idToDelete);
            setTranscript(newTranscript);
        }
    };

    // Simulation Effect
    useEffect(() => {
        let interval;
        let currentId = simStartId;

        if (isSimulating) {
            interval = setInterval(() => {
                addTranscriptLine({
                    id: currentId,
                    timestamp: Math.floor(Date.now() / 1000),
                    segments: [{ text: `Simulated Line ${currentId}`, timestamp: Math.floor(Date.now() / 1000) }],
                });
                currentId++;
            }, simInterval);
        }

        return () => clearInterval(interval);
    }, [isSimulating, simInterval, simStartId, addTranscriptLine]);

    const handleStartSim = () => setIsSimulating(true);
    const handleStopSim = () => setIsSimulating(false);

    const handleSetMediaAvailability = () => {
        const ids = mediaIds
            .split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));

        if (ids.length > 0) {
            const files = {};
            ids.forEach((id) => {
                files[id] = `simulated_file_${id}`;
            });
            updateLineMedia(selectedId, files, mediaAvailable);
            recalculateClipRange();
        }
    };

    // Performance Stats Effect (FPS & Memory)
    useEffect(() => {
        if (!open || tabValue !== 1) return;

        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId;
        let statsInterval;

        const loop = () => {
            const now = performance.now();
            frameCount++;
            if (now >= lastTime + 1000) {
                setFps(Math.round((frameCount * 1000) / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();

        const updateStats = () => {
            // Memory (Chrome only)
            if (performance.memory) {
                setMemory({
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                });
            }
        };
        statsInterval = setInterval(updateStats, 1000);
        updateStats();

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(statsInterval);
        };
    }, [open, tabValue]);

    // Chart Data Preparation
    const now = Date.now();

    const pingMetrics = metrics.filter((m) => m.type === "ping");
    const lineMetrics = metrics.filter((m) => m.type === "line");

    // Convert ms to seconds
    const latencyData = pingMetrics.map((m) => m.latency / 1000);
    const latencyX = pingMetrics.map((m) => (m.receivedAt - now) / 1000);

    const jitterData = lineMetrics.map((m) => (m.interArrival || 0) / 1000);
    const lineX = lineMetrics.map((m) => (m.receivedAt - now) / 1000);

    const uploadTimeData = lineMetrics.map((m) => (m.uploadTime || 0) / 1000);

    const formatRelativeTime = (seconds) => {
        const abs = Math.abs(seconds);
        const mins = Math.floor(abs / 60);
        const secs = Math.floor(abs % 60);
        const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        return seconds < 0 ? `-${formatted}` : formatted;
    };

    // Calculate aggregated stats
    const avgLatency =
        latencyData.length > 0 ? (latencyData.reduce((a, b) => a + b, 0) / latencyData.length).toFixed(3) : 0;
    const avgJitter =
        jitterData.length > 0 ? (jitterData.reduce((a, b) => a + b, 0) / jitterData.length).toFixed(3) : 0;
    const avgUploadTime =
        uploadTimeData.length > 0 ? (uploadTimeData.reduce((a, b) => a + b, 0) / uploadTimeData.length).toFixed(3) : 0;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle data-testid="devtools-title">Dev Tools</DialogTitle>
            <DialogContent>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="dev tools tabs">
                        <Tab label="Controls" />
                        <Tab label="Performance" />
                    </Tabs>
                </Box>

                {/* Controls Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Box>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleClearTranscript}
                                data-testid="devtools-clear-transcript"
                            >
                                Clear Transcript
                            </Button>
                        </Box>

                        <Box sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                            <Typography variant="h6">Stream State</Typography>
                            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
                                <TextField
                                    label="Active Title"
                                    size="small"
                                    data-testid="devtools-active-title"
                                    value={streamTitle}
                                    onChange={(e) => setStreamTitle(e.target.value)}
                                    sx={{ minWidth: 200 }}
                                />
                                <TextField
                                    label="Start Time"
                                    size="small"
                                    data-testid="devtools-start-time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(Number(e.target.value))}
                                    type="number"
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Media Type</InputLabel>
                                    <Select
                                        data-testid="devtools-media-type"
                                        value={mediaType}
                                        label="Media Type"
                                        onChange={(e) => setMediaType(e.target.value)}
                                    >
                                        <MenuItem value="none">None</MenuItem>
                                        <MenuItem value="audio">Audio</MenuItem>
                                        <MenuItem value="video">Video</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            data-testid="devtools-is-live"
                                            checked={isLive}
                                            onChange={(e) => setIsLive(e.target.checked)}
                                        />
                                    }
                                    label="Is Live"
                                />
                            </Box>
                        </Box>

                        <Box sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                            <Typography variant="h6">Add Line</Typography>
                            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                                <TextField
                                    label="ID"
                                    size="small"
                                    data-testid="devtools-line-id"
                                    value={lineId}
                                    onChange={(e) => setLineId(e.target.value)}
                                    type="number"
                                />
                                <TextField
                                    label="Timestamp"
                                    size="small"
                                    data-testid="devtools-line-timestamp"
                                    value={lineTimestamp}
                                    onChange={(e) => setLineTimestamp(e.target.value)}
                                    type="number"
                                />
                            </Box>
                            <Typography variant="subtitle2">Segments</Typography>
                            {segments.map((seg, index) => (
                                <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                                    <TextField
                                        label="Text"
                                        size="small"
                                        data-testid="devtools-segment-text"
                                        fullWidth
                                        value={seg.text}
                                        onChange={(e) => handleSegmentChange(index, "text", e.target.value)}
                                    />
                                    <TextField
                                        label="Ts"
                                        size="small"
                                        data-testid="devtools-segment-timestamp"
                                        sx={{ width: 100 }}
                                        value={seg.timestamp}
                                        onChange={(e) => handleSegmentChange(index, "timestamp", e.target.value)}
                                    />
                                    <IconButton
                                        size="small"
                                        data-testid="devtools-remove-segment"
                                        onClick={() => handleRemoveSegment(index)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button data-testid="devtools-add-segment" startIcon={<Add />} onClick={handleAddSegment}>
                                Add Segment
                            </Button>
                            <Box sx={{ mt: 2 }}>
                                <Button data-testid="devtools-add-line" variant="contained" onClick={handleAddLine}>
                                    Add Line
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                            <Typography variant="h6">Simulation</Typography>
                            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                                <TextField
                                    data-testid="devtools-sim-start-id"
                                    label="Start ID"
                                    size="small"
                                    value={simStartId}
                                    onChange={(e) => setSimStartId(Number(e.target.value))}
                                    type="number"
                                />
                                <TextField
                                    data-testid="devtools-sim-interval"
                                    label="Interval (ms)"
                                    size="small"
                                    value={simInterval}
                                    onChange={(e) => setSimInterval(Number(e.target.value))}
                                    type="number"
                                />
                                {!isSimulating ? (
                                    <Button
                                        data-testid="devtools-start-sim"
                                        variant="contained"
                                        color="success"
                                        startIcon={<PlayArrow />}
                                        onClick={handleStartSim}
                                    >
                                        Start
                                    </Button>
                                ) : (
                                    <Button
                                        data-testid="devtools-stop-sim"
                                        variant="contained"
                                        color="warning"
                                        startIcon={<Stop />}
                                        onClick={handleStopSim}
                                    >
                                        Stop
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                            <Typography variant="h6">Media Availability</Typography>
                            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                                <TextField
                                    data-testid="devtools-media-ids"
                                    label="Line IDs (comma-separated)"
                                    size="small"
                                    value={mediaIds}
                                    onChange={(e) => setMediaIds(e.target.value)}
                                    sx={{ flexGrow: 1 }}
                                />
                                <FormControlLabel
                                    data-testid="devtools-media-available"
                                    control={
                                        <Switch
                                            checked={mediaAvailable}
                                            onChange={(e) => setMediaAvailable(e.target.checked)}
                                        />
                                    }
                                    label={mediaAvailable ? "Available" : "Unavailable"}
                                />
                                <Button
                                    data-testid="devtools-set-media-availability"
                                    variant="contained"
                                    onClick={handleSetMediaAvailability}
                                >
                                    Set
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                            <Typography variant="h6">Delete Line</Typography>
                            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                <TextField
                                    data-testid="devtools-delete-id"
                                    label="ID to Delete"
                                    size="small"
                                    value={deleteId}
                                    onChange={(e) => setDeleteId(e.target.value)}
                                    type="number"
                                />
                                <Button
                                    data-testid="devtools-delete-line"
                                    variant="contained"
                                    color="error"
                                    onClick={handleDeleteLine}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </TabPanel>

                {/* Performance Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={2.4}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    FPS
                                </Typography>
                                <Typography variant="h6">{fps}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={2.4}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    Memory (Used/Total)
                                </Typography>
                                <Typography variant="h6">
                                    {memory.used > 0 ? `${memory.used}/${memory.total} MB` : "N/A"}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={2.4}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    Avg Latency
                                </Typography>
                                <Typography variant="h6">{avgLatency} s</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={2.4}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    Avg Inter-arrival
                                </Typography>
                                <Typography variant="h6">{avgJitter} s</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={2.4}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    Avg Upload Time
                                </Typography>
                                <Typography variant="h6">{avgUploadTime} s</Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Typography variant="h6">Server Upload Time (s)</Typography>
                    {uploadTimeData.length > 0 ? (
                        <LineChart
                            xAxis={[{ data: lineX, valueFormatter: formatRelativeTime, label: "Time ago (mm:ss)" }]}
                            yAxis={[{ min: 0 }]}
                            series={[
                                { data: uploadTimeData, label: "Upload Time", color: "#8884d8", curve: "catmullRom" },
                            ]}
                            height={250}
                        />
                    ) : (
                        <Typography color="text.secondary">No data yet</Typography>
                    )}

                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Server-Client Latency (s)
                    </Typography>
                    {latencyData.length > 0 ? (
                        <LineChart
                            xAxis={[{ data: latencyX, valueFormatter: formatRelativeTime, label: "Time ago (mm:ss)" }]}
                            yAxis={[{ min: 0 }]}
                            series={[{ data: latencyData, label: "Latency", curve: "catmullRom" }]}
                            height={250}
                        />
                    ) : (
                        <Typography color="text.secondary">No data yet</Typography>
                    )}

                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Message Inter-arrival Time (s)
                    </Typography>
                    {jitterData.length > 0 ? (
                        <LineChart
                            xAxis={[{ data: lineX, valueFormatter: formatRelativeTime, label: "Time ago (mm:ss)" }]}
                            yAxis={[{ min: 0 }]}
                            series={[
                                { data: jitterData, label: "Inter-arrival", color: "#82ca9d", curve: "catmullRom" },
                            ]}
                            height={250}
                        />
                    ) : (
                        <Typography color="text.secondary">No data yet</Typography>
                    )}
                </TabPanel>
            </DialogContent>
            <DialogActions>
                <Button data-testid="devtools-close" onClick={handleClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
