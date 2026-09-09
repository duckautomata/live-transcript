import { memo } from "react";
import { Box, Paper, Tooltip, Typography, CircularProgress, useTheme } from "@mui/material";
import { orange, purple, blue } from "@mui/material/colors";
import FrameImage from "./FrameImage";
import { useAppStore } from "../../store/store";
import { unixToLocal, unixToRelative, unixToUTC } from "../../logic/dateTime";
import { getFrameUrl } from "../../logic/mediaUrls";

/**
 * One tile of the frame grid. Keyboard reachable (Enter / Space open the same dialog as a click).
 * @param {object} props
 * @param {string} props.mediaBaseUrl
 * @param {import("../../store/types").TranscriptLine} props.line
 * @param {Record<number, any[]> | undefined} props.lineTags - Tag rows for this line, keyed by segment index.
 * @param {string} props.streamId
 * @param {string} props.wsKey
 * @param {boolean} props.isSelected - Whether this is the tile last opened in the dialog.
 * @param {function(import("../../store/types").TranscriptLine): void} props.onFrameClick
 * @param {number} props.startTime
 * @param {number} props.aspectRatio - width / height of this stream's frames.
 */
const FrameItem = memo(
    ({ mediaBaseUrl, line, lineTags, streamId, wsKey, isSelected, onFrameClick, startTime, aspectRatio = 16 / 9 }) => {
        const theme = useTheme();
        const timeFormat = useAppStore((state) => state.timeFormat);
        const storeStartTime = useAppStore((state) => state.startTime);

        const effectiveStartTime = startTime ?? storeStartTime;

        const formatTimestamp = (timestamp) => {
            if (timeFormat === "relative") {
                return unixToRelative(timestamp, effectiveStartTime);
            } else if (timeFormat === "local") {
                return unixToLocal(timestamp);
            } else if (timeFormat === "UTC") {
                return unixToUTC(timestamp);
            }
            return unixToLocal(timestamp);
        };

        let borderColor = "transparent";
        const tooltipLines = [];

        if (lineTags) {
            let isChapter = false;
            let isCollection = false;
            let isTag = false;

            Object.values(lineTags).forEach((tags) => {
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

        const timestampText = formatTimestamp(line.timestamp);

        const handleKeyDown = (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onFrameClick(line);
            }
        };

        return (
            <Box data-testid={`transcript-frame-${line.id}`} sx={{ width: "100%" }}>
                <Tooltip title={tooltipContent} arrow placement="top">
                    <Paper
                        elevation={2}
                        role="button"
                        tabIndex={0}
                        aria-label={`Frame ${line.id}, ${timestampText}`}
                        sx={{
                            cursor: "pointer",
                            overflow: "hidden",
                            position: "relative",
                            outline: isSelected ? `3px solid ${theme.palette.primary.main}` : "none",
                            border: `4px solid ${borderColor}`,
                            "&:hover, &:focus-visible": {
                                outline: `3px solid ${theme.palette.primary.light}`,
                            },
                            aspectRatio: String(aspectRatio),
                            boxSizing: "border-box", // Ensure border doesn't break size
                        }}
                        onClick={() => onFrameClick(line)}
                        onKeyDown={handleKeyDown}
                    >
                        {line.mediaAvailable ? (
                            <FrameImage
                                src={getFrameUrl(mediaBaseUrl, wsKey, streamId, line.fileId)}
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
                                {timestampText}
                            </Typography>
                        </Box>
                    </Paper>
                </Tooltip>
            </Box>
        );
    },
);

FrameItem.displayName = "FrameItem";

export default FrameItem;
