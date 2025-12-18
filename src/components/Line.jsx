import { IconButton, Typography } from "@mui/material";
import { forwardRef, Fragment, memo, useState } from "react";
import Segment from "./Segment";
import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { unixToLocal, unixToRelative, unixToUTC } from "../logic/dateTime";
import { MoreHoriz } from "@mui/icons-material";
import { maxClipSize } from "../config";
import { useAppStore } from "../store/store";
import { useShallow } from "zustand/shallow";

const TimestampTheme = styled("span")(({ theme }) => ({
    "&": {
        color: theme.palette.timestamp.main,
    },
}));

/**
 * A full line in the transcript, containing multiple segments.
 * @param {object} props
 * @param {import('react').ForwardedRef<HTMLDivElement>} props.ref - The ref of the line.
 * @param {number} props.id - The id of the line.
 * @param {number} props.lineTimestamp - The timestamp of the line.
 * @param {import("../store/types").Segment[]} props.segments - The segments of the line.
 */
const Line = memo(
    forwardRef(
        /**
         * @param {{ id: number, lineTimestamp: number, segments: import("../store/types").Segment[] }} props
         * @param {import('react').ForwardedRef<HTMLDivElement>} ref
         */
        ({ id, lineTimestamp, segments }, ref) => {
            const theme = useTheme();

            const [idOver, setIdOver] = useState(false);

            const setTagPopupOpen = useAppStore((state) => state.setTagPopupOpen);
            const setTagPopupTimestamp = useAppStore((state) => state.setTagPopupTimestamp);
            const setTagPopupText = useAppStore((state) => state.setTagPopupText);
            const setLineMenuId = useAppStore((state) => state.setLineMenuId);

            const startTime = useAppStore((state) => state.startTime);
            const timeFormat = useAppStore((state) => state.timeFormat);
            const density = useAppStore((state) => state.density);

            const { isSelected, isInClipRange, isPlaying, isClipable, isClipStart } = useAppStore(
                useShallow((state) => {
                    const { lineMenuId, clipStartIndex, clipEndIndex, audioId } = state;

                    const isBetween = (start, end, current) =>
                        (start <= current && current <= end) || (end <= current && current <= start);

                    const inMenuClipRange =
                        lineMenuId >= 0 && clipStartIndex >= 0 && isBetween(clipStartIndex, lineMenuId, id);
                    const inFinalClipRange =
                        clipEndIndex >= 0 && clipStartIndex >= 0 && isBetween(clipStartIndex, clipEndIndex, id);

                    return {
                        isSelected: lineMenuId === id,
                        isClipStart: clipStartIndex === id,
                        isInClipRange:
                            (inMenuClipRange || inFinalClipRange) && Math.abs(clipStartIndex - id) < maxClipSize,
                        isPlaying: audioId === id,
                        isClipable: clipStartIndex >= 0 && Math.abs(clipStartIndex - id) < maxClipSize,
                    };
                }),
            );

            const onSegmentClick = (timestamp, text) => {
                setTagPopupTimestamp(timestamp);
                setTagPopupText(text);
                setTagPopupOpen(true);
            };

            const onIdClick = () => {
                setLineMenuId(id);
            };

            const convertTime = (time) => {
                if (timeFormat === "relative") {
                    return unixToRelative(time, startTime);
                } else if (timeFormat === "local") {
                    return unixToLocal(time);
                } else if (timeFormat === "UTC") {
                    return unixToUTC(time);
                } else {
                    return time;
                }
            };

            const colorBackground = () => {
                if (isClipStart || isInClipRange) {
                    return theme.palette.lineground.clip;
                }
                if (idOver || isSelected || isPlaying) {
                    return theme.palette.lineground.main;
                }
                return "none";
            };

            const iconColor = isClipable ? theme.palette.id.clip : theme.palette.id.main;
            const hasSegments = segments?.length > 0;
            const iconSize = density === "comfortable" ? "medium" : "small";
            const iconSx = density === "compact" ? { padding: 0 } : {};

            return (
                <Typography
                    ref={ref}
                    color="secondary"
                    aria-live="assertive"
                    padding="1px"
                    whiteSpace="pre-wrap"
                    align="left"
                    id={id}
                    style={{
                        background: colorBackground(),
                        wordBreak: "break-word",
                    }}
                >
                    <IconButton
                        size={iconSize}
                        sx={iconSx}
                        onClick={onIdClick}
                        onMouseEnter={() => setIdOver(true)}
                        onMouseLeave={() => setIdOver(false)}
                        id={`line-button-${id}`}
                    >
                        <MoreHoriz style={{ color: iconColor }} />
                    </IconButton>{" "}
                    [<TimestampTheme theme={theme}>{convertTime(lineTimestamp)}</TimestampTheme>]{" "}
                    {hasSegments ? (
                        segments.map((segment, index) => (
                            <Fragment key={`line-${id}-segment-${index}`}>
                                <Segment timestamp={segment?.timestamp} text={segment?.text} onClick={onSegmentClick} />
                                {index < segments.length - 1 && " "}
                            </Fragment>
                        ))
                    ) : (
                        <Segment timestamp={lineTimestamp} text={"          "} onClick={onSegmentClick} />
                    )}
                </Typography>
            );
        },
    ),
);

export default Line;
