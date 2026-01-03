import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Dialog,
    DialogContent,
    Tooltip,
} from "@mui/material";
import { BrokenImage } from "@mui/icons-material";
import { VirtuosoGrid } from "react-virtuoso";
import styled from "@emotion/styled";
import { server } from "../../config";
import { orange, purple, blue } from "@mui/material/colors";
import { useAppStore } from "../../store/store";
import { unixToLocal, unixToRelative, unixToUTC } from "../../logic/dateTime";
import Line from "./Line";
const FrameImage = ({ src, alt, style, ...props }) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.disabledBackground",
                    color: "text.secondary",
                }}
            >
                <BrokenImage sx={{ fontSize: 40 }} />
                <Typography variant="body2">Image Unavailable</Typography>
            </Box>
        );
    }

    return <img src={src} alt={alt} onError={() => setError(true)} style={style} {...props} />;
};

const ItemContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0.5),
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
}));

const ListContainer = styled(Box)(() => ({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
}));

/**
 * TranscriptFrame component for displaying the transcript as a grid of frames.
 *
 * @param {object} props
 * @param {object[]} props.displayData
 * @param {string} props.activeId
 * @param {string} props.wsKey
 * @param {Map<string, any[]>} props.tagsMap
 */
export default function TranscriptFrame({ displayData, activeId, wsKey, tagsMap }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const timeFormat = useAppStore((state) => state.timeFormat);
    const startTime = useAppStore((state) => state.startTime);

    const [selectedLine, setSelectedLine] = useState(null);
    const [lastSelectedId, setLastSelectedId] = useState(null);

    const reversedDisplayData = useMemo(() => {
        return [...displayData].reverse();
    }, [displayData]);

    const activeItemWidth = useMemo(() => {
        if (isMobile) return "50%"; // 2 per row on mobile
        return "200px"; // Fixed width on desktop
    }, [isMobile]);

    const formatTimestamp = (timestamp) => {
        if (timeFormat === "relative") {
            return unixToRelative(timestamp, startTime);
        } else if (timeFormat === "local") {
            return unixToLocal(timestamp);
        } else if (timeFormat === "UTC") {
            return unixToUTC(timestamp);
        }
        return unixToLocal(timestamp);
    };

    const handleFrameClick = (line) => {
        setSelectedLine(line);
        setLastSelectedId(line.id);
    };

    useEffect(() => {
        if (!selectedLine) return;

        const handleKeyDown = (e) => {
            if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                e.preventDefault();

                const currentIndex = reversedDisplayData.findIndex((l) => l.id === selectedLine.id);
                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                const isShift = e.shiftKey;
                const tenMinutes = 600;

                // Directions
                // ArrowRight -> Newer (Future) -> Index Decreases (since list is Newest First)
                // ArrowLeft -> Older (Past) -> Index Increases
                const isNewer = e.key === "ArrowRight";

                if (isShift) {
                    const targetTime = selectedLine.timestamp + (isNewer ? tenMinutes : -tenMinutes);

                    // Find closest frame to targetTime in the correct direction
                    let closestIdx = currentIndex;
                    let minDiff = Math.abs(reversedDisplayData[currentIndex].timestamp - targetTime);

                    if (isNewer) {
                        // Scan indices < currentIndex (Newer items)
                        for (let i = currentIndex - 1; i >= 0; i--) {
                            const diff = Math.abs(reversedDisplayData[i].timestamp - targetTime);
                            if (diff <= minDiff) {
                                minDiff = diff;
                                closestIdx = i;
                            } else {
                                // Since timestamps are sorted, once diff increases, we are moving away from target
                                break;
                            }
                        }
                    } else {
                        // Scan indices > currentIndex (Older items)
                        for (let i = currentIndex + 1; i < reversedDisplayData.length; i++) {
                            const diff = Math.abs(reversedDisplayData[i].timestamp - targetTime);
                            if (diff <= minDiff) {
                                minDiff = diff;
                                closestIdx = i;
                            } else {
                                break;
                            }
                        }
                    }
                    nextIndex = closestIdx;
                } else {
                    // Single Step
                    if (isNewer) {
                        nextIndex = Math.max(0, currentIndex - 1);
                    } else {
                        nextIndex = Math.min(reversedDisplayData.length - 1, currentIndex + 1);
                    }
                }

                if (nextIndex !== currentIndex) {
                    const nextLine = reversedDisplayData[nextIndex];
                    setSelectedLine(nextLine);
                    setLastSelectedId(nextLine.id);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedLine, reversedDisplayData]);

    const handleClose = () => {
        setSelectedLine(null);
    };

    return (
        <Box sx={{ flexGrow: 1, height: "100%", minHeight: 0 }}>
            {displayData.length === 0 ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                    }}
                >
                    <Typography>No frames available.</Typography>
                </Box>
            ) : (
                <VirtuosoGrid
                    style={{ height: "100%" }}
                    data={reversedDisplayData}
                    components={{
                        List: ListContainer,
                        Item: ({ children, ...props }) => (
                            <ItemContainer {...props} sx={{ width: activeItemWidth }}>
                                {children}
                            </ItemContainer>
                        ),
                    }}
                    itemClassName="frame-item"
                    itemContent={(index, line) => {
                        let borderColor = "transparent";
                        const tooltipLines = [];

                        if (tagsMap && line.segments) {
                            let isChapter = false;
                            let isCollection = false;
                            let isTag = false;

                            line.segments.forEach((seg, i) => {
                                const key = `${line.id}_${i}`;
                                const tags = tagsMap.get(key);
                                if (tags) {
                                    tags.forEach((t) => {
                                        if (t.type === "header") {
                                            if (t.subtype === "chapter") isChapter = true;
                                            if (t.subtype === "collection") isCollection = true;
                                            tooltipLines.push(`[${t.subtype}] ${t.name}`);
                                        } else {
                                            if (t.subtype === "collection") isCollection = true;
                                            isTag = true;
                                            tooltipLines.push(t.text);
                                        }
                                    });
                                }
                            });

                            if (isChapter) borderColor = orange[500];
                            else if (isCollection) borderColor = purple[500];
                            else if (isTag) borderColor = blue[500];
                        }

                        const tooltipContent =
                            tooltipLines.length > 0 ? (
                                <Box>
                                    {tooltipLines.map((txt, idx) => (
                                        <Typography key={idx} variant="body2">
                                            {txt}
                                        </Typography>
                                    ))}
                                </Box>
                            ) : (
                                ""
                            );

                        return (
                            <Box sx={{ width: "100%" }}>
                                <Tooltip title={tooltipContent} arrow placement="top">
                                    <Paper
                                        elevation={2}
                                        sx={{
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            position: "relative",
                                            outline:
                                                line.id === lastSelectedId
                                                    ? `3px solid ${theme.palette.primary.main}`
                                                    : "none",
                                            border: `4px solid ${borderColor}`,
                                            "&:hover": {
                                                outline: `3px solid ${theme.palette.primary.light}`,
                                            },
                                            aspectRatio: "16/9",
                                            boxSizing: "border-box", // Ensure border doesn't break size
                                        }}
                                        onClick={() => handleFrameClick(line)}
                                    >
                                        {line.mediaAvailable ? (
                                            <FrameImage
                                                src={`${server}/${wsKey}/frame?id=${line.id}&stream_id=${activeId}`}
                                                alt={`Frame ${line.id}`}
                                                loading="lazy"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    bgcolor: "action.disabledBackground",
                                                }}
                                            >
                                                <CircularProgress size={24} color="secondary" />
                                            </Box>
                                        )}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                bgcolor: "rgba(0, 0, 0, 0.6)",
                                                color: "white",
                                                p: 0.5,
                                                textAlign: "center",
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ display: "block", lineHeight: 1 }}>
                                                {formatTimestamp(line.timestamp)}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Tooltip>
                            </Box>
                        );
                    }}
                />
            )}

            <Dialog open={!!selectedLine} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogContent>
                    {selectedLine && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box
                                sx={{
                                    width: "100%",
                                    aspectRatio: "16/9",
                                    overflow: "hidden",
                                    borderRadius: 1,
                                    bgcolor: "black",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                {selectedLine.mediaAvailable ? (
                                    <FrameImage
                                        src={`${server}/${wsKey}/frame?id=${selectedLine.id}&stream_id=${activeId}`}
                                        alt={`Frame ${selectedLine.id}`}
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                ) : (
                                    <CircularProgress color="secondary" />
                                )}
                            </Box>
                            <Paper sx={{ p: 1 }}>
                                <Line
                                    id={selectedLine.id}
                                    lineTimestamp={selectedLine.timestamp}
                                    segments={selectedLine.segments}
                                    mediaAvailable={selectedLine.mediaAvailable}
                                    tagsMap={tagsMap}
                                />
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
