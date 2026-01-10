import { IconButton, Typography, Tooltip } from "@mui/material";
import { forwardRef, Fragment, memo, useMemo, useState } from "react";
import Segment from "./Segment";
import { useTheme, keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { unixToLocal, unixToRelative, unixToUTC } from "../../logic/dateTime";
import { MoreHoriz, ContentCut, RestartAlt } from "@mui/icons-material";
import { maxClipSize } from "../../config";
import { useAppStore } from "../../store/store";
import { useShallow } from "zustand/shallow";

/** @typedef {import("../../store/types").Segment} Segment */
/** @typedef {import('react').ForwardedRef<HTMLDivElement>} Ref */

const TimestampTheme = styled("span")(({ theme }) => ({
    "&": {
        color: theme.palette.timestamp.main,
    },
}));

const loadingAnimation = keyframes`
  0% {
    rotate: 90deg;
  }
  50% {
    rotate: 270deg;
  }
  100% {
    rotate: 450deg;
  }
`;

/**
 * A full line in the transcript, containing multiple segments.
 * @param {object} props
 * @param {Ref} props.ref - The ref of the line.
 * @param {number} props.id - The id of the line.
 * @param {number} props.lineTimestamp - The timestamp of the line.
 * @param {Segment[]} props.segments - The segments of the line.
 * @param {boolean} [props.highlight] - Whether to highlight the line.
 * @param {boolean} [props.mediaAvailable] - Whether media is available for this line.
 */
const Line = memo(
    forwardRef(
        /**
         * @param {{ id: number, lineTimestamp: number, segments: Segment[], highlight?: boolean, mediaAvailable?: boolean }} props
         * @param {Ref} ref
         */
        ({ id, lineTimestamp, segments, highlight, tagsMap, ...props }, ref) => {
            const theme = useTheme();

            const [idOver, setIdOver] = useState(false);

            const setTagPopupOpen = useAppStore((state) => state.setTagPopupOpen);
            const setTagPopupTimestamp = useAppStore((state) => state.setTagPopupTimestamp);
            const setTagPopupText = useAppStore((state) => state.setTagPopupText);
            const setLineMenuId = useAppStore((state) => state.setLineMenuId);
            const setClipPopupOpen = useAppStore((state) => state.setClipPopupOpen);
            const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
            const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);

            const startTime = useAppStore((state) => state.startTime);
            const timeFormat = useAppStore((state) => state.timeFormat);
            const density = useAppStore((state) => state.density);
            const mediaType = useAppStore((state) => state.mediaType);

            const isMediaMissing = mediaType !== "none" && props.mediaAvailable === false;

            const {
                isSelected,
                isInClipRange,
                isPlaying,
                isClipable,
                isClipStart,
                clipMode,
                clipStartIndex,
                isRangeValid,
            } = useAppStore(
                useShallow((state) => {
                    const {
                        lineMenuId,
                        clipStartIndex,
                        clipEndIndex,
                        audioId,
                        clipInvalidBefore,
                        clipInvalidAfter,
                        clipMode,
                    } = state;

                    const isBetween = (start, end, current) =>
                        (start <= current && current <= end) || (end <= current && current <= start);

                    const isRangeValid =
                        clipStartIndex >= 0 &&
                        (id < clipStartIndex
                            ? id > (clipInvalidBefore ?? -1)
                            : id < (clipInvalidAfter ?? Number.MAX_SAFE_INTEGER));

                    const inMenuClipRange =
                        lineMenuId >= 0 && clipStartIndex >= 0 && isBetween(clipStartIndex, lineMenuId, id);
                    const inFinalClipRange =
                        clipEndIndex >= 0 && clipStartIndex >= 0 && isBetween(clipStartIndex, clipEndIndex, id);

                    return {
                        isSelected: lineMenuId === id,
                        isClipStart: clipStartIndex === id,
                        isInClipRange:
                            isRangeValid &&
                            (inMenuClipRange || inFinalClipRange) &&
                            Math.abs(clipStartIndex - id) < maxClipSize,
                        isPlaying: audioId === id,
                        isClipable: clipStartIndex >= 0 && Math.abs(clipStartIndex - id) < maxClipSize && isRangeValid,
                        clipMode,
                        clipStartIndex,
                        isRangeValid,
                    };
                }),
            );

            const onSegmentClick = (timestamp, text) => {
                setTagPopupTimestamp(timestamp);
                setTagPopupText(text);
                setTagPopupOpen(true);
            };

            const isClipTargetValid = useMemo(() => {
                if (isMediaMissing) return false;
                if (clipStartIndex === -1) return true;
                return isRangeValid && Math.abs(clipStartIndex - id) < maxClipSize;
            }, [isMediaMissing, clipStartIndex, isRangeValid, id]);

            const onIdClick = () => {
                if (clipMode) {
                    if (!isClipTargetValid) return;

                    if (clipStartIndex === -1) {
                        setClipStartIndex(id);
                    } else if (clipStartIndex === id) {
                        setClipStartIndex(-1);
                    } else {
                        setClipEndIndex(id);
                        setClipPopupOpen(true);
                        // Note: setClipPopupOpen(true) will implicitly set clipMode to false via the slice setter
                    }
                } else {
                    setLineMenuId(id);
                }
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
                if (highlight) {
                    return theme.palette.action.selected; // Use a distinct highlight color
                }
                if (isClipStart || isInClipRange) {
                    return theme.palette.lineground.clip;
                }
                if (idOver || isSelected || isPlaying) {
                    return theme.palette.lineground.main;
                }
                return "none";
            };

            const iconColor = isMediaMissing
                ? theme.palette.id.loading
                : clipMode
                  ? isClipTargetValid
                      ? theme.palette.secondary.main
                      : theme.palette.action.disabled
                  : isClipable
                    ? theme.palette.id.clip
                    : theme.palette.id.main;
            const hasSegments = segments?.length > 0;
            const iconSize = density === "comfortable" ? "medium" : "small";
            const iconSx = density === "compact" ? { padding: 0 } : {};
            const timestampColor = theme.palette.timestamp.main;

            return (
                <Typography
                    ref={ref}
                    className={highlight ? "highlight" : ""}
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
                    <Tooltip title={isMediaMissing ? "Media isn't available yet" : ""}>
                        <IconButton
                            size={iconSize}
                            sx={{
                                ...iconSx,
                                animation: isMediaMissing ? `${loadingAnimation} 1.5s infinite ease-in-out` : "none",
                            }}
                            onClick={onIdClick}
                            onMouseEnter={() => setIdOver(true)}
                            onMouseLeave={() => setIdOver(false)}
                            id={`line-button-${id}`}
                            disabled={clipMode && !isClipTargetValid}
                        >
                            {clipMode ? (
                                isClipStart ? (
                                    <RestartAlt style={{ color: iconColor }} />
                                ) : isClipTargetValid ? (
                                    <ContentCut style={{ color: iconColor }} />
                                ) : (
                                    <MoreHoriz style={{ color: iconColor }} />
                                )
                            ) : (
                                <MoreHoriz style={{ color: iconColor }} />
                            )}
                        </IconButton>
                    </Tooltip>{" "}
                    [
                    <TimestampTheme theme={theme} style={{ color: timestampColor }}>
                        {convertTime(lineTimestamp)}
                    </TimestampTheme>
                    ]{" "}
                    {hasSegments ? (
                        segments.map((segment, index) => {
                            const segmentTags = tagsMap?.get(`${id}_${index}`);
                            return (
                                <Fragment key={`line-${id}-segment-${index}`}>
                                    <Segment
                                        timestamp={segment?.timestamp}
                                        text={segment?.text}
                                        onClick={onSegmentClick}
                                        tags={segmentTags}
                                    />
                                    <span />
                                    {index < segments.length - 1 && " "}
                                </Fragment>
                            );
                        })
                    ) : (
                        <Segment
                            timestamp={lineTimestamp}
                            text={"          "}
                            onClick={onSegmentClick}
                            tags={tagsMap?.get(`${id}_0`)}
                        />
                    )}
                </Typography>
            );
        },
    ),
);

export default Line;
