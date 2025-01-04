import { Typography } from "@mui/material";
import { Fragment, useContext } from "react";
import Segment from "./Segment";
import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { TagOffsetPopupContext } from "../providers/TagOffsetPopupProvider";
import { unixToLocal, unixToRelative, unixToUTC } from "../logic/dateTime";

const IdButtonTheme = styled("span")(({ theme }) => ({
    cursor: "pointer",
    "&": {
        color: theme.palette.id.main,
    },
    "&:hover": {
        backgroundColor: theme.palette.id.background,
    },
}));

const IdTheme = styled("span")(({ theme }) => ({
    "&": {
        color: theme.palette.id.main,
    },
}));

const TimestampTheme = styled("span")(({ theme }) => ({
    "&": {
        color: theme.palette.timestamp.main,
    },
}));

export default function Line({ id, segments, audioUrl, audioDownloader, timeFormat, startTime }) {
    const theme = useTheme();
    const { setOpen, setTimestamp } = useContext(TagOffsetPopupContext);

    const onClick = (timestamp) => {
        setTimestamp(timestamp);
        setOpen(true);
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

    return (
        <Typography color="secondary" aria-live="assertive" padding="0px" whiteSpace="pre-wrap" align="left">
            {audioDownloader ? (
                <IdButtonTheme theme={theme} onClick={() => window.open(audioUrl, "_blank")}>
                    {id}
                </IdButtonTheme>
            ) : (
                <IdTheme theme={theme}>{id}</IdTheme>
            )}
            : [<TimestampTheme theme={theme}>{convertTime(firstTime)}</TimestampTheme>]{" "}
            {segments.map((segment, index) => (
                <Fragment key={segment?.timestamp + segment?.text}>
                    <Segment timestamp={segment?.timestamp} text={segment?.text} onClick={onClick} />
                    {index < segments.length - 1 && " "}
                </Fragment>
            ))}
        </Typography>
    );
}
