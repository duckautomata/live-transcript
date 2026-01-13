import { memo } from "react";
import { Box, Paper, Tooltip, Typography, CircularProgress, useTheme } from "@mui/material";
import { orange, purple, blue } from "@mui/material/colors";
import { server } from "../../config";
import FrameImage from "./FrameImage";
import { useAppStore } from "../../store/store";
import { unixToLocal, unixToRelative, unixToUTC } from "../../logic/dateTime";

const FrameItem = memo(({ line, tagsMap, activeId, wsKey, lastSelectedId, onFrameClick }) => {
    const theme = useTheme();
    const timeFormat = useAppStore((state) => state.timeFormat);
    const startTime = useAppStore((state) => state.startTime);

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
        <Box data-testid={`transcript-frame-${line.id}`} role="transcript-frame" sx={{ width: "100%" }}>
            <Tooltip title={tooltipContent} arrow placement="top">
                <Paper
                    elevation={2}
                    sx={{
                        cursor: "pointer",
                        overflow: "hidden",
                        position: "relative",
                        outline: line.id === lastSelectedId ? `3px solid ${theme.palette.primary.main}` : "none",
                        border: `4px solid ${borderColor}`,
                        "&:hover": {
                            outline: `3px solid ${theme.palette.primary.light}`,
                        },
                        aspectRatio: "16/9",
                        boxSizing: "border-box", // Ensure border doesn't break size
                    }}
                    onClick={() => onFrameClick(line)}
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
});

FrameItem.displayName = "FrameItem";

export default FrameItem;
