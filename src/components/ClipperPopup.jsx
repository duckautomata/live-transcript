import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    CircularProgress,
    Box,
} from "@mui/material";
import { useState, useRef, useEffect, useMemo } from "react";
import { server } from "../config";
import { useAppStore } from "../store/store";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { RestartAlt } from "@mui/icons-material";
import { unixToRelative } from "../logic/dateTime";
import { downloadClipUrl, playClipUrl } from "../logic/mediaUrls";

/**
 * A popup dialog for configuring and downloading media clips.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
const ClipperPopup = ({ wsKey }) => {
    const clipPopupOpen = useAppStore((state) => state.clipPopupOpen);
    const clipStartIndex = useAppStore((state) => state.clipStartIndex);
    const clipEndIndex = useAppStore((state) => state.clipEndIndex);
    const mediaType = useAppStore((state) => state.mediaType);
    const mediaBaseUrl = useAppStore((state) => state.mediaBaseUrl);
    const transcript = useAppStore((state) => state.transcript);
    const startTime = useAppStore((state) => state.startTime);
    const activeId = useAppStore((state) => state.activeId);
    const pastStreamViewing = useAppStore((state) => state.pastStreamViewing);
    const selectedId = pastStreamViewing || activeId;

    const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);

    /** @type {['config' | 'preview', (step: 'config' | 'preview') => void]} */
    const [step, setStep] = useState("config");
    const [isCreating, setIsCreating] = useState(false);
    const [isTrimming, setIsTrimming] = useState(false);
    const [clipId, setClipId] = useState(null);
    const [clipFilename, setClipFilename] = useState("");

    const [clipName, setClipName] = useState("");
    const [fileFormat, setFileFormat] = useState("");
    const [formatError, setFormatError] = useState(false);
    const [creationError, setCreationError] = useState("");

    // WaveSurfer state
    const waveformRef = useRef(null);
    const videoRef = useRef(null);
    const wavesurfer = useRef(null);
    const regions = useRef(null);
    const isLooping = useRef(false);
    const [loopingActive, setLoopingActive] = useState(false);

    const [isLoaded, setIsLoaded] = useState(false);
    const [trimRegion, setTrimRegion] = useState({ start: 0, end: 0 });
    const [duration, setDuration] = useState(0);

    const hasVideo = mediaType === "video";

    const startLine = useMemo(
        () => transcript.find((l) => l.id === Math.min(clipStartIndex, clipEndIndex)),
        [transcript, clipStartIndex, clipEndIndex],
    );
    const endLine = useMemo(
        () => transcript.find((l) => l.id === Math.max(clipStartIndex, clipEndIndex)),
        [transcript, clipStartIndex, clipEndIndex],
    );

    const processClipCreation = async (skipPreview) => {
        if (fileFormat === "") {
            setFormatError(true);
            return;
        }

        setCreationError("");
        setIsCreating(true);

        const start = Math.min(clipStartIndex, clipEndIndex);
        const end = Math.max(clipStartIndex, clipEndIndex);

        try {
            const response = await fetch(`${server}/${wsKey}/clip`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    stream_id: selectedId,
                    start: start,
                    end: end,
                    type: fileFormat,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            // Expecting { "status": "success", "clip_id": "..." }

            const id = data.clip_id;
            setClipId(id);

            if (skipPreview) {
                const url = downloadClipUrl(mediaBaseUrl, wsKey, selectedId, id, fileFormat, clipName);
                window.open(url, "_blank");
                handleReset();
            } else {
                setStep("preview");
            }
        } catch (error) {
            setCreationError(`Unable to create the clip: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDownload = async () => {
        if (!clipId) return;

        setCreationError("");

        // If user has modified the region significantly or explicitly wants to trim
        const isTrimmed = trimRegion.start > 0.1 || trimRegion.end < duration - 0.1;

        if (isTrimmed) {
            setIsTrimming(true);
            try {
                const response = await fetch(`${server}/${wsKey}/trim`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        stream_id: selectedId,
                        clip_id: clipId,
                        file_format: fileFormat,
                        start: trimRegion.start,
                        end: trimRegion.end,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Trim failed with status ${response.status}`);
                }

                const data = await response.json();
                const newClipId = data.clip_id;

                const url = downloadClipUrl(mediaBaseUrl, wsKey, selectedId, newClipId, fileFormat, clipName);
                window.open(url, "_blank");
                handleReset();
            } catch (error) {
                setCreationError(`Unable to trim clip: ${error.message}`);
            } finally {
                setIsTrimming(false);
            }
        } else {
            const url = downloadClipUrl(mediaBaseUrl, wsKey, selectedId, clipId, fileFormat, clipName);
            window.open(url, "_blank");
            handleReset();
        }
    };

    const handleResetTrim = () => {
        if (regions.current) {
            regions.current.clearRegions();
            regions.current.addRegion({
                start: 0,
                end: duration,
                color: "rgba(56, 212, 186, 0.4)",
                drag: true,
                resize: true,
            });
            setTrimRegion({ start: 0, end: duration });
        }
    };

    const handleManualStartChange = (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) return;

        // If trying to go past end, clamp or ignore?
        // Best to just ignore invalid updates that cross over
        if (val >= trimRegion.end) return;

        setTrimRegion((prev) => ({ ...prev, start: val }));

        if (regions.current) {
            const region = regions.current.getRegions()[0];
            if (region) {
                region.setOptions({ start: val });
            }
        }
    };

    const handleManualEndChange = (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val) || val > duration) return;

        if (val <= trimRegion.start) return;

        setTrimRegion((prev) => ({ ...prev, end: val }));

        if (regions.current) {
            const region = regions.current.getRegions()[0];
            if (region) {
                region.setOptions({ end: val });
            }
        }
    };

    const handleReset = () => {
        // cleanup wavesurfer
        if (wavesurfer.current) {
            wavesurfer.current.destroy();
            wavesurfer.current = null;
        }

        setClipStartIndex(-1);
        setClipEndIndex(-1);
        handleClose();
    };

    const handleClose = () => {
        setClipName("");
        setFileFormat("");
        setFormatError(false);
        setClipEndIndex(-1);
        setClipPopupOpen(false);
        setStep("config");
        setClipId(null);
        setClipFilename("");
        setIsLoaded(false);
        setCreationError("");
        setIsTrimming(false);
    };

    // Initialize WaveSurfer when entering 'preview'
    useEffect(() => {
        if (step === "preview" && clipId && waveformRef.current) {
            const container = waveformRef.current;
            // Clear previous if any
            container.innerHTML = "";

            // New stream URL format
            const url = playClipUrl(mediaBaseUrl, wsKey, selectedId, clipId, fileFormat);
            let audioUrl = url;

            const wsOptions = {
                container: container,
                waveColor: "#4f4f4f",
                progressColor: "#38d4ba", // Mint color
                height: 100,
                barWidth: 2,
                barGap: 1,
                mediaControls: true,
            };

            if (fileFormat === "mp4") {
                audioUrl = playClipUrl(mediaBaseUrl, wsKey, selectedId, clipId, "m4a");
            }
            if (fileFormat === "mp4" && videoRef.current) {
                videoRef.current.src = url;
            }
            wsOptions.url = audioUrl;

            const ws = WaveSurfer.create(wsOptions);

            // Sync video with audio
            if (fileFormat === "mp4" && videoRef.current) {
                const vid = videoRef.current;
                let lastSeek = 0;

                ws.on("play", () => vid.play());
                ws.on("pause", () => vid.pause());
                ws.on("timeupdate", (currentTime) => {
                    if (ws.isPlaying()) {
                        if (Math.abs(vid.currentTime - currentTime) > 0.2) {
                            vid.currentTime = currentTime;
                        }
                    } else {
                        // Throttle seeking during scrub to avoid "hundreds of requests"
                        // 150ms = ~6-7 updates per second, smooth enough but not spammy
                        const now = Date.now();
                        if (now - lastSeek > 150) {
                            vid.currentTime = currentTime;
                            lastSeek = now;
                        }
                    }
                });

                // Ensure sync on click/end of drag
                ws.on("interaction", (newTime) => {
                    if (!ws.isPlaying()) {
                        vid.currentTime = newTime;
                        lastSeek = Date.now();
                    }
                });
            }

            // Add Regions plugin
            const wsRegions = ws.registerPlugin(RegionsPlugin.create());
            regions.current = wsRegions;

            ws.on("decode", () => {
                const dur = ws.getDuration();
                setDuration(dur);
                // Create a region covering the whole file by default
                wsRegions.addRegion({
                    start: 0,
                    end: dur,
                    color: "rgba(56, 212, 186, 0.4)", // Transparent mint
                    drag: true,
                    resize: true,
                });
                setTrimRegion({ start: 0, end: dur });
                setIsLoaded(true);
            });

            wsRegions.on("region-updated", (region) => {
                setTrimRegion({ start: region.start, end: region.end });
            });

            wsRegions.on("region-clicked", (region, e) => {
                e.stopPropagation(); // prevent seek
                isLooping.current = false;
                setLoopingActive(false);
                region.play();
            });

            wsRegions.on("region-out", (region) => {
                if (isLooping.current) {
                    region.play();
                }
            });

            wavesurfer.current = ws;

            return () => {
                isLooping.current = false;
                setLoopingActive(false);
                ws.destroy();
            };
        }
    }, [step, clipId, wsKey, fileFormat, selectedId, mediaBaseUrl]);

    // Keyboard controls
    useEffect(() => {
        /**
         * @param {KeyboardEvent} e
         */
        const handleKeyDown = (e) => {
            if (step !== "preview" || !isLoaded) return;

            // Helper to get current region
            const getRegion = () => regions.current?.getRegions()[0];

            if (e.code === "Space") {
                e.preventDefault();
                if (e.shiftKey) {
                    const region = getRegion();
                    if (region) {
                        isLooping.current = true;
                        setLoopingActive(true);
                        region.play();
                    }
                } else {
                    isLooping.current = false;
                    setLoopingActive(false);
                    wavesurfer.current?.playPause();
                }
            } else if (e.code === "KeyA") {
                if (e.ctrlKey || e.metaKey) {
                    return;
                }
                // Set start to current time
                const region = getRegion();
                const currentTime = wavesurfer.current?.getCurrentTime();
                if (region && currentTime !== undefined) {
                    // Ensure start doesn't go past end
                    if (currentTime < region.end) {
                        region.setOptions({ start: currentTime });
                        setTrimRegion({ start: currentTime, end: region.end });
                    }
                }
            } else if (e.code === "KeyD") {
                if (e.ctrlKey || e.metaKey) {
                    return;
                }
                // Set end to current time
                const region = getRegion();
                const currentTime = wavesurfer.current?.getCurrentTime();
                if (region && currentTime !== undefined) {
                    // Ensure end is after start
                    if (currentTime > region.start) {
                        region.setOptions({ end: currentTime });
                        setTrimRegion({ start: region.start, end: currentTime });
                    }
                }
            } else if (e.code === "KeyR") {
                if (e.shiftKey) {
                    return;
                }
                // Reset trim
                if (regions.current && wavesurfer.current) {
                    const dur = wavesurfer.current.getDuration();
                    regions.current.clearRegions();
                    regions.current.addRegion({
                        start: 0,
                        end: dur,
                        color: "rgba(56, 212, 186, 0.4)",
                        drag: true,
                        resize: true,
                    });
                    setTrimRegion({ start: 0, end: dur });
                }
            } else if (e.code === "ArrowLeft") {
                e.preventDefault();
                if (e.altKey) {
                    // Shift region left
                    const region = getRegion();
                    if (region) {
                        const shift = 0.1;
                        let newStart = region.start - shift;
                        let newEnd = region.end - shift;

                        if (newStart < 0) {
                            newStart = 0;
                            newEnd = region.end - region.start;
                        }

                        if (region.start > 0) {
                            region.setOptions({ start: newStart, end: newEnd });
                            setTrimRegion({ start: newStart, end: newEnd });
                        }
                    }
                } else {
                    wavesurfer.current?.skip(-0.1);
                }
            } else if (e.code === "ArrowRight") {
                e.preventDefault();
                if (e.altKey) {
                    // Shift region right
                    const region = getRegion();
                    if (region) {
                        const shift = 0.1;
                        const dur = wavesurfer.current?.getDuration() || 0;
                        let newStart = region.start + shift;
                        let newEnd = region.end + shift;

                        if (newEnd > dur) {
                            newEnd = dur;
                            newStart = dur - (region.end - region.start);
                        }

                        if (region.end < dur) {
                            region.setOptions({ start: newStart, end: newEnd });
                            setTrimRegion({ start: newStart, end: newEnd });
                        }
                    }
                } else {
                    wavesurfer.current?.skip(0.1);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [step, isLoaded]);

    // Derived info for UI
    const infoText = useMemo(() => {
        if (!startLine || !endLine) return "";
        const sTime = unixToRelative(startLine.timestamp, startTime);
        const eTime = unixToRelative(endLine.timestamp, startTime);
        return `From ${sTime} to ${eTime}`;
    }, [startLine, endLine, startTime]);

    return (
        <Dialog open={clipPopupOpen} onClose={handleReset} maxWidth="md" fullWidth>
            <DialogTitle>Clip Editor</DialogTitle>
            <DialogContent>
                {step === "config" && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <Typography variant="body1">
                            Creating a clip containing {1 + Math.abs(clipEndIndex - clipStartIndex)} lines.
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {infoText}
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                            <TextField
                                label="Clip Name"
                                value={clipName}
                                onChange={(e) => setClipName(e.target.value)}
                                sx={{ flexGrow: 1 }}
                                autoFocus
                            />

                            <FormControl error={formatError} sx={{ minWidth: 150 }}>
                                <InputLabel id="format-select-label">File Format</InputLabel>
                                <Select
                                    labelId="format-select-label"
                                    value={fileFormat}
                                    label="File Format"
                                    onChange={(e) => {
                                        setFileFormat(e.target.value);
                                        setFormatError(false);
                                    }}
                                >
                                    <MenuItem value="mp3">MP3 (Audio)</MenuItem>
                                    <MenuItem value="m4a">M4A (Audio)</MenuItem>
                                    <MenuItem value="mp4" disabled={!hasVideo}>
                                        MP4 (Video)
                                    </MenuItem>
                                </Select>
                                {formatError && <FormHelperText>Please select a format.</FormHelperText>}
                            </FormControl>
                        </Box>
                        {creationError && (
                            <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: "center" }}>
                                {creationError}
                            </Typography>
                        )}
                    </Box>
                )}

                {step === "preview" && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Trim your clip
                            {clipFilename && (
                                <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                    Current File: {clipFilename}.{fileFormat}
                                </Typography>
                            )}
                            {loopingActive && (
                                <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ ml: 2, fontWeight: "bold", color: "primary.main" }}
                                >
                                    Looping, pause to stop
                                </Typography>
                            )}
                        </Typography>

                        {/* Video Player */}
                        {fileFormat === "mp4" && (
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                                <video
                                    ref={videoRef}
                                    style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px" }}
                                    controls={false}
                                    muted
                                />
                            </Box>
                        )}

                        {/* Waveform Container */}
                        <Box
                            sx={{
                                width: "100%",
                                minHeight: "100px",
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                position: "relative",
                            }}
                        >
                            <div ref={waveformRef} style={{ width: "100%", height: "100%", minHeight: "100px" }} />
                            {!isLoaded && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 5,
                                    }}
                                >
                                    <CircularProgress size={30} />
                                </Box>
                            )}
                        </Box>

                        {/* Controls */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: "action.hover",
                                p: 1,
                                borderRadius: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 2, sm: 3 },
                                    width: "100%",
                                    justifyContent: "center",
                                    flexDirection: { xs: "column", sm: "row" },
                                }}
                            >
                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <TextField
                                        label="Start"
                                        type="number"
                                        size="small"
                                        value={trimRegion.start}
                                        onChange={handleManualStartChange}
                                        inputProps={{ step: 0.01, min: 0, max: trimRegion.end }}
                                        sx={{ width: 100 }}
                                    />
                                    <TextField
                                        label="End"
                                        type="number"
                                        size="small"
                                        value={trimRegion.end}
                                        onChange={handleManualEndChange}
                                        inputProps={{ step: 0.01, min: trimRegion.start, max: duration }}
                                        sx={{ width: 100 }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ minWidth: "120px", textAlign: "center" }}>
                                    Duration: <strong>{(trimRegion.end - trimRegion.start).toFixed(2)}s</strong>
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={handleResetTrim}
                                    color="inherit"
                                    sx={{ ml: { xs: 0, sm: 2 } }}
                                    startIcon={<RestartAlt />}
                                >
                                    Reset Trim
                                </Button>
                            </Box>
                        </Box>

                        <Typography
                            variant="caption"
                            sx={{ display: "block", textAlign: "center", mt: 0.5, color: "text.secondary" }}
                        >
                            <strong>Keyboard Controls:</strong>{" "}
                            <Box component="span" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                Space
                            </Box>{" "}
                            (Play/Pause),{" "}
                            <Box component="span" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                Shift+Space
                            </Box>{" "}
                            (Play Region),{" "}
                            <Box component="span" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                &larr;/&rarr;
                            </Box>{" "}
                            (Seek),{" "}
                            <Box component="span" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                Alt+&larr;/&rarr;
                            </Box>{" "}
                            (Move Selection),{" "}
                            <Box component="span" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                A/D
                            </Box>{" "}
                            (Set Start/End),{" "}
                            <Box component="span" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                R
                            </Box>{" "}
                            (Reset)
                        </Typography>
                        {creationError && (
                            <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: "center" }}>
                                {creationError}
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
                <Button onClick={handleReset} color="inherit">
                    Cancel
                </Button>

                {step === "config" ? (
                    <>
                        <Button
                            onClick={() => processClipCreation(true)}
                            color="primary"
                            disabled={isCreating}
                            startIcon={isCreating && <CircularProgress size={20} />}
                        >
                            {isCreating ? "Processing..." : "Direct Download"}
                        </Button>
                        <Button
                            onClick={() => processClipCreation(false)}
                            variant="contained"
                            disabled={isCreating}
                            startIcon={isCreating && <CircularProgress size={20} />}
                        >
                            {isCreating ? "Processing..." : "Trim Clip"}
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={handleDownload}
                        variant="contained"
                        color="primary"
                        disabled={!isLoaded || isTrimming}
                        startIcon={isTrimming && <CircularProgress size={20} />}
                    >
                        {isTrimming ? "Trimming..." : "Download Clip"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ClipperPopup;
