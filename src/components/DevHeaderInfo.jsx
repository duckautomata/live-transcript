import { Typography, Box } from "@mui/material";
import { useEffect, useState } from "react";
import { unixToRelative } from "../logic/dateTime";
import { useAppStore } from "../store/store";

/**
 * Displays developer information in the header:
 * - Time since stream started
 * - Time since last line received
 * @param {object} props
 * @param {number} props.startTime - The start Unix timestamp of the stream.
 */
export default function DevHeaderInfo({ startTime }) {
    // Timer logic
    const [currentTime, setCurrentTime] = useState(startTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // TimeSinceLastLine logic
    const lastLineReceivedAt = useAppStore((state) => state.lastLineReceivedAt);
    const [msSince, setMsSince] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (lastLineReceivedAt > 0) {
                setMsSince(Date.now() - lastLineReceivedAt);
            } else {
                setMsSince(0);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [lastLineReceivedAt]);

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" component="div">
                Time since start: {unixToRelative(currentTime, startTime)}
            </Typography>
            {lastLineReceivedAt > 0 && (
                <Typography variant="subtitle2" component="div" sx={{ color: "text.secondary" }}>
                    Time since last line: {(msSince / 1000).toFixed(1)}s
                </Typography>
            )}
        </Box>
    );
}
