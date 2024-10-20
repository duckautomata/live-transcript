import { Typography } from "@mui/material";
import { Fragment, useContext } from "react";
import Segment from "./Segment";
import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { TagOffsetPopupContext } from "../providers/TagOffsetPopupProvider";

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

export default function Line({ id, segments }) {
    const theme = useTheme();
    const {setOpen, setTimestamp} = useContext(TagOffsetPopupContext)
    const unixToLocal = (unix) => {
        // Convert to milliseconds
        const date = new Date(unix * 1000);

        // Convert to local time string
        const localTime = date.toLocaleTimeString();

        return localTime;
    };

    const onClick = (timestamp) => {
        setTimestamp(timestamp)
        setOpen(true)
    }

    const firstTime = segments?.[0]?.timestamp ?? 0;

    return (
        <Typography color="secondary" aria-live="assertive" padding="0px" whiteSpace="pre-wrap" align="left">
            <IdTheme theme={theme}>{id}</IdTheme>: [
            <TimestampTheme theme={theme}>{unixToLocal(firstTime)}</TimestampTheme>]{" "}
            {segments.map((segment, index) => (
                <Fragment key={segment?.timestamp}>
                    <Segment timestamp={segment?.timestamp} text={segment?.text} onClick={onClick}/>
                    {index < segments.length - 1 && " "}
                </Fragment>
            ))}
        </Typography>
    );
}
