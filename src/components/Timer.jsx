import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { unixToRelative } from "../logic/dateTime";

export default function LiveTimer({ startTime }) {
    const [currentTime, setCurrentTime] = useState(startTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Typography variant="subtitle1" component="div" sx={{ mb: 2 }}>
            Time since start: {unixToRelative(currentTime, startTime)}
        </Typography>
    );
}
