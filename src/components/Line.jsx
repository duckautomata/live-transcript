import { IconButton, Typography } from "@mui/material";
import { Fragment, useContext, useState } from "react";
import Segment from "./Segment";
import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { TagOffsetPopupContext } from "../providers/TagOffsetPopupProvider";
import { unixToLocal, unixToRelative, unixToUTC } from "../logic/dateTime";
import { LineMenuContext } from "../providers/LineMenuProvider";
import { AudioContext } from "../providers/AudioProvider";
import { ClipperPopupContext } from "../providers/ClipperPopupProvider";
import { MoreHoriz } from "@mui/icons-material";

const TimestampTheme = styled("span")(({ theme }) => ({
    "&": {
        color: theme.palette.timestamp.main,
    },
}));

export default function Line({ id, lineTimestamp, segments, timeFormat, startTime, density }) {
    const theme = useTheme();
    const { setOpen, setTimestamp, setText } = useContext(TagOffsetPopupContext);
    const { lineMenuId, setAnchorEl, setLineMenuId } = useContext(LineMenuContext);
    const { audioId } = useContext(AudioContext);
    const { clipStartIndex, clipEndIndex, maxClipSize } = useContext(ClipperPopupContext);
    const [idOver, setIdOver] = useState(false);

    const onSegmentClick = (timestamp, text) => {
        setTimestamp(timestamp);
        setText(text);
        setOpen(true);
    };

    const isClipable = clipStartIndex >= 0 && Math.abs(clipStartIndex - id) < maxClipSize;
    const iconColor = isClipable ? theme.palette.id.clip : theme.palette.id.main;

    const onIdClick = (event) => {
        setLineMenuId(id);
        setAnchorEl(event.currentTarget);
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
        if (clipStartIndex === id) {
            return theme.palette.lineground.clip;
        }

        if (
            lineMenuId >= 0 &&
            clipStartIndex >= 0 &&
            Math.abs(clipStartIndex - id) < maxClipSize &&
            ((clipStartIndex <= id && id <= lineMenuId) || (lineMenuId <= id && id <= clipStartIndex))
        ) {
            return theme.palette.lineground.clip;
        }

        if (
            clipEndIndex >= 0 &&
            clipStartIndex >= 0 &&
            Math.abs(clipStartIndex - id) < maxClipSize &&
            ((clipStartIndex <= id && id <= clipEndIndex) || (clipEndIndex <= id && id <= clipStartIndex))
        ) {
            return theme.palette.lineground.clip;
        }

        if (idOver || lineMenuId === id || audioId === id) {
            return theme.palette.lineground.main;
        }
        return "none";
    };

    const hasSegments = segments?.length > 0;
    const iconSize = density === "comfortable" ? "medium" : "small";
    const iconSx = density === "compact" ? { padding: 0 } : {};

    // Menu item: https://mui.com/material-ui/react-menu/#positioned-menu
    // Should have a separate component for the menu, and pass the anchorEl as a context
    return (
        <Typography
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
            >
                <MoreHoriz style={{ color: iconColor }} />
            </IconButton>{" "}
            [<TimestampTheme theme={theme}>{convertTime(lineTimestamp)}</TimestampTheme>]{" "}
            {hasSegments ? (
                segments.map((segment, index) => (
                    <Fragment key={`${index}_${segment?.timestamp}_${segment?.text}`}>
                        <Segment timestamp={segment?.timestamp} text={segment?.text} onClick={onSegmentClick} />
                        {index < segments.length - 1 && " "}
                    </Fragment>
                ))
            ) : (
                <Segment timestamp={lineTimestamp} text={"          "} onClick={onSegmentClick} fullWidth={true} />
            )}
        </Typography>
    );
}
