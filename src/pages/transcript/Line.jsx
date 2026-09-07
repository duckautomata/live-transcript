import { IconButton, Link, Typography, Tooltip } from "@mui/material";
import { forwardRef, Fragment, memo, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import Segment from "./Segment";
import { useTheme, keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { unixToLocal, unixToRelative, unixToUTC } from "../../logic/dateTime";
import { MoreHoriz, ContentCut, RestartAlt } from "@mui/icons-material";
import { maxClipSize } from "../../config";
import { useAppStore } from "../../store/store";
import { selectActiveMediaType } from "../../store/selectors";
import { useShallow } from "zustand/shallow";
import { splitSegmentsByTerm } from "../../logic/search";
import { lineHash } from "../../logic/links";

/** @typedef {import("../../store/types").Segment} Segment */
/** @typedef {import('react').ForwardedRef<HTMLDivElement>} Ref */
/** @typedef {Record<number, object[]>} LineTags - Tag rows per segment index. */

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
 * Opens the tag offset calculator for a segment. Module-level so every memoized Segment keeps a stable
 * `onClick` prop and the line does not need a store subscription per setter.
 * @param {number} timestamp
 * @param {string} text
 */
const onSegmentClick = (timestamp, text) => {
    const { setTagPopupTimestamp, setTagPopupText, setTagPopupOpen } = useAppStore.getState();
    setTagPopupTimestamp(timestamp);
    setTagPopupText(text);
    setTagPopupOpen(true);
};

/**
 * Wraps `children` in a Tooltip only when there is something to show; an empty Tooltip still costs a
 * component, listeners and a ref per line.
 * @param {{ title: string, describeChild?: boolean, children: React.ReactElement }} props
 */
function OptionalTooltip({ title, describeChild, children }) {
    if (!title) return children;
    return (
        <Tooltip title={title} describeChild={describeChild}>
            {children}
        </Tooltip>
    );
}

/**
 * A full line in the transcript, containing multiple segments.
 * @param {object} props
 * @param {Ref} props.ref - The ref of the line.
 * @param {number} props.id - The id of the line.
 * @param {number} props.lineTimestamp - The timestamp of the line.
 * @param {Segment[]} props.segments - The segments of the line.
 * @param {boolean} [props.highlight] - Whether to highlight the line.
 * @param {boolean} [props.mediaAvailable] - Whether media is available for this line.
 * @param {boolean} [props.vodAccurate] - Whether the line timestamp matches the VOD precisely.
 * @param {LineTags} [props.lineTags] - Tag rows for this line, keyed by segment index (undefined for most lines).
 * @param {string} [props.searchTerm] - Normalized search term; every occurrence in the text is highlighted.
 * @param {string} [props.linkBase] - Path (+ search) the timestamp link is built on ("/doki/?stream=x").
 * @param {function(MouseEvent, number): void} [props.onLinkClick] - Called with the click event and the line id when the timestamp link is clicked.
 */
const Line = memo(
    forwardRef(
        /**
         * @param {{ id: number, lineTimestamp: number, segments: Segment[], highlight?: boolean, mediaAvailable?: boolean, vodAccurate?: boolean, startTime?: number, lineTags?: LineTags, searchTerm?: string, linkBase?: string, onLinkClick?: function }} props
         * @param {Ref} ref
         */
        (
            {
                id,
                lineTimestamp,
                segments,
                highlight,
                lineTags,
                startTime,
                searchTerm,
                linkBase,
                onLinkClick,
                ...props
            },
            ref,
        ) => {
            const theme = useTheme();

            const storeStartTime = useAppStore((state) => state.startTime);
            const timeFormat = useAppStore((state) => state.timeFormat);
            const density = useAppStore((state) => state.density);
            const mediaType = useAppStore(selectActiveMediaType);
            const enableTagHelper = useAppStore((state) => state.enableTagHelper);

            const effectiveStartTime = startTime ?? storeStartTime;

            const isMediaMissing = mediaType !== "none" && props.mediaAvailable === false;
            const isTimestampApproximated = props.vodAccurate === false;

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

            // Only lines that are actually rendered pay for this, and only while a search is active.
            const highlightParts = useMemo(
                () => (searchTerm ? splitSegmentsByTerm(segments, searchTerm) : null),
                [segments, searchTerm],
            );

            const isClipTargetValid = useMemo(() => {
                if (isMediaMissing) return false;
                if (clipStartIndex === -1) return true;
                return isRangeValid && Math.abs(clipStartIndex - id) < maxClipSize;
            }, [isMediaMissing, clipStartIndex, isRangeValid, id]);

            // Store actions are read at event time instead of through one subscription per setter per line.
            const onIdClick = () => {
                const { setClipStartIndex, setClipEndIndex, setClipPopupOpen, setLineMenuId } = useAppStore.getState();
                if (clipMode) {
                    if (!isClipTargetValid) return;

                    if (clipStartIndex === -1) {
                        setClipStartIndex(id);
                    } else {
                        setClipEndIndex(id);
                        setClipPopupOpen(true);
                        // Note: setClipPopupOpen(true) will implicitly set clipMode to false via the slice setter
                    }
                } else {
                    setLineMenuId(id);
                }
            };

            const onResetClipStart = (e) => {
                e.stopPropagation();
                useAppStore.getState().setClipStartIndex(-1);
            };

            const convertTime = (time) => {
                if (timeFormat === "relative") {
                    return unixToRelative(time, effectiveStartTime);
                } else if (timeFormat === "local") {
                    return unixToLocal(time);
                } else if (timeFormat === "UTC") {
                    return unixToUTC(time);
                } else {
                    return time;
                }
            };

            const backgroundColor = (() => {
                if (highlight) {
                    return theme.palette.action.selected; // Use a distinct highlight color
                }
                if (isClipStart || isInClipRange) {
                    return theme.palette.lineground.clip;
                }
                if (isSelected || isPlaying) {
                    return theme.palette.lineground.main;
                }
                return "transparent";
            })();

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
            const lineTo = `${linkBase ?? ""}${lineHash(id)}`;
            const menuOpen = !clipMode && isSelected;

            return (
                <Typography
                    ref={ref}
                    className={highlight ? "highlight" : ""}
                    color="secondary"
                    align="left"
                    id={id}
                    data-testid={`transcript-line-${id}`}
                    sx={{
                        padding: "1px",
                        whiteSpace: "pre-wrap",
                        backgroundColor,
                        wordBreak: "break-word",
                        "&:hover": {
                            textDecoration: "underline",
                        },
                    }}
                >
                    {clipMode && isClipStart && (
                        <Tooltip title="Reset Clip Start">
                            <IconButton
                                size={iconSize}
                                sx={iconSx}
                                onClick={onResetClipStart}
                                aria-label="Reset clip start"
                                data-testid={`line-button-${id}-reset`}
                            >
                                <RestartAlt style={{ color: theme.palette.error.main }} data-testid="RestartAltIcon" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <OptionalTooltip title={isMediaMissing ? "Media isn't available yet" : ""}>
                        <IconButton
                            size={iconSize}
                            sx={{
                                ...iconSx,
                                animation: isMediaMissing ? `${loadingAnimation} 1.5s infinite ease-in-out` : "none",
                            }}
                            onClick={onIdClick}
                            id={`line-button-${id}`}
                            data-testid={isMediaMissing ? `line-button-${id}-loading` : `line-button-${id}`}
                            disabled={clipMode && !isClipTargetValid}
                            aria-label={clipMode ? `Select line ${id} for the clip` : `Line ${id} options`}
                            aria-haspopup={clipMode ? undefined : "menu"}
                            aria-expanded={menuOpen ? true : undefined}
                            aria-controls={menuOpen ? "line-menu" : undefined}
                        >
                            {clipMode ? (
                                isClipTargetValid ? (
                                    <ContentCut style={{ color: iconColor }} data-testid="ContentCutIcon" />
                                ) : (
                                    <MoreHoriz style={{ color: iconColor }} data-testid="MoreHorizIcon" />
                                )
                            ) : (
                                <MoreHoriz style={{ color: iconColor }} data-testid="MoreHorizIcon" />
                            )}
                        </IconButton>
                    </OptionalTooltip>{" "}
                    <OptionalTooltip
                        title={
                            isTimestampApproximated
                                ? "Timestamp is approximated and may not align precisely with the VOD"
                                : ""
                        }
                        describeChild
                    >
                        {/* A real link, so a line can be opened in a new tab or its address copied. `replace` keeps
                            a series of jumps from cluttering the back button. */}
                        <Link
                            component={RouterLink}
                            to={lineTo}
                            replace
                            onClick={onLinkClick ? (event) => onLinkClick(event, id) : undefined}
                            underline="hover"
                            color="inherit"
                            // The tooltip describes an approximated timestamp, so no native title next to it.
                            title={isTimestampApproximated ? undefined : "Link to this line"}
                            data-testid={isTimestampApproximated ? `line-timestamp-${id}-approx` : `line-anchor-${id}`}
                        >
                            [
                            <TimestampTheme style={{ opacity: isTimestampApproximated ? 0.75 : 1 }}>
                                {isTimestampApproximated ? "≈" : ""}
                                {convertTime(lineTimestamp)}
                            </TimestampTheme>
                            ]
                        </Link>
                    </OptionalTooltip>{" "}
                    {hasSegments ? (
                        segments.map((segment, index) => (
                            <Fragment key={`line-${id}-segment-${index}`}>
                                <Segment
                                    id={index}
                                    timestamp={segment?.timestamp}
                                    text={segment?.text}
                                    onClick={onSegmentClick}
                                    enableTagHelper={enableTagHelper}
                                    tags={lineTags ? lineTags[index] : undefined}
                                    parts={highlightParts ? highlightParts[index] : null}
                                />
                                {index < segments.length - 1 && " "}
                            </Fragment>
                        ))
                    ) : (
                        <Segment
                            id={0}
                            timestamp={lineTimestamp}
                            text={"          "}
                            onClick={onSegmentClick}
                            enableTagHelper={enableTagHelper}
                            tags={lineTags ? lineTags[0] : undefined}
                        />
                    )}
                </Typography>
            );
        },
    ),
);

export default Line;
