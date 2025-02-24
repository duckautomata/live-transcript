import { Typography } from "@mui/material";
import { Fragment, useContext, useState } from "react";
import Segment from "./Segment";
import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { TagOffsetPopupContext } from "../providers/TagOffsetPopupProvider";
import { unixToLocal, unixToRelative, unixToUTC } from "../logic/dateTime";
import { LineMenuContext } from "../providers/LineMenuProvider";
import { SettingContext } from "../providers/SettingProvider";
import { AudioContext } from "../providers/AudioProvider";

const IdButtonTheme = styled("span")(({ theme }) => ({
    cursor: "pointer",
    "&": {
        color: theme.palette.id.main,
    },
    "&:hover": {
        backgroundColor: theme.palette.id.background,
    },
}));

const TimestampTheme = styled("span")(({ theme }) => ({
    "&": {
        color: theme.palette.timestamp.main,
    },
}));

export default function Line({ id, segments, timeFormat, startTime }) {
    const theme = useTheme();
    const { setOpen, setTimestamp } = useContext(TagOffsetPopupContext);
    const { lineMenuId, setAnchorEl, setLineMenuId } = useContext(LineMenuContext);
    const { newAtTop } = useContext(SettingContext);
    const { audioId } = useContext(AudioContext);
    const [idOver, setIdOver] = useState(false);

    const onSegmentClick = (timestamp) => {
        setTimestamp(timestamp);
        setOpen(true);
    };

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

    const firstTime = segments?.[0]?.timestamp ?? 0;
    // Menu item: https://mui.com/material-ui/react-menu/#positioned-menu
    // Should have a separate component for the menu, and pass the anchorEl as a context
    return (
        <Typography
            color="secondary"
            aria-live="assertive"
            padding="1px"
            whiteSpace="pre-wrap"
            align="left"
            style={{
                textDecoration:
                    idOver || lineMenuId === id || audioId === id ? (newAtTop ? "underline" : "overline") : "none",
            }}
        >
            <IdButtonTheme
                theme={theme}
                onClick={onIdClick}
                onMouseEnter={() => setIdOver(true)}
                onMouseLeave={() => setIdOver(false)}
            >
                {id}
            </IdButtonTheme>
            : [<TimestampTheme theme={theme}>{convertTime(firstTime)}</TimestampTheme>]{" "}
            {segments.map((segment, index) => (
                <Fragment key={`${index}_${segment?.timestamp}_${segment?.text}`}>
                    <Segment timestamp={segment?.timestamp} text={segment?.text} onClick={onSegmentClick} />
                    {index < segments.length - 1 && " "}
                </Fragment>
            ))}
        </Typography>
    );
}
