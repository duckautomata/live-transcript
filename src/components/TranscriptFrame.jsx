import { useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Dialog,
    DialogContent,
} from "@mui/material";
import { VirtuosoGrid } from "react-virtuoso";
import styled from "@emotion/styled";
import { server } from "../config";
import { useAppStore } from "../store/store";
import { unixToLocal, unixToRelative, unixToUTC } from "../logic/dateTime";
import Line from "./Line";

const ItemContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0.5),
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
}));

const ListContainer = styled(Box)(({ theme }) => ({
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
 */
export default function TranscriptFrame({ displayData, activeId, wsKey }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const timeFormat = useAppStore((state) => state.timeFormat);
    const startTime = useAppStore((state) => state.startTime);

    const [selectedLine, setSelectedLine] = useState(null);
    const [lastSelectedId, setLastSelectedId] = useState(null);

    const activeItemWidth = useMemo(() => {
        if (isMobile) return "33.33%"; // 3 per row on mobile
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
                    data={displayData}
                    components={{
                        List: ListContainer,
                        Item: ItemContainer,
                    }}
                    itemClassName="frame-item"
                    itemContent={(index, line) => (
                        <Box sx={{ width: activeItemWidth }}>
                            <Paper
                                elevation={2}
                                sx={{
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    position: "relative",
                                    outline:
                                        line.id === lastSelectedId ? `3px solid ${theme.palette.primary.main}` : "none",
                                    "&:hover": {
                                        outline: `3px solid ${theme.palette.primary.light}`,
                                    },
                                    aspectRatio: "16/9",
                                }}
                                onClick={() => handleFrameClick(line)}
                            >
                                {line.mediaAvailable ? (
                                    <img
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
                        </Box>
                    )}
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
                                    <img
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
                                />
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
