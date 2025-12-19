import { Box, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { useCallback, useState } from "react";
import { LineChart } from "@mui/x-charts";
import { unixToLocal, unixToRelative, unixToUTC } from "../logic/dateTime";
import "./StreamWordCount.css";
import { countWord } from "../logic/wordCount";
import { useAppStore } from "../store/store";

/**
 * Component providing word usage analysis and visualization via a LineChart.
 */
export default function StreamWordCount() {
    const activeTitle = useAppStore((state) => state.activeTitle);
    const transcript = useAppStore((state) => state.transcript);
    const startTime = useAppStore((state) => state.startTime);
    const timeFormat = useAppStore((state) => state.timeFormat);

    const [word, setWord] = useState("");
    const isMobile = useMediaQuery("(max-width:768px)");

    const convertTime = (/** @type {number} */ time) => {
        if (timeFormat === "relative") {
            return unixToRelative(time, startTime);
        } else if (timeFormat === "local") {
            return unixToLocal(time);
        } else if (timeFormat === "UTC") {
            return unixToUTC(time);
        } else {
            return `${time}`;
        }
    };

    const transcriptToLineData = useCallback(() => {
        // Each index in the data array is a specific line in the transcript.
        // id 0 = first line
        // The value is equal to the sum up to and including that line. So it would be data[i-1] + lineSum
        /** @type {number[]} */
        const data = [];
        /** @type {number[]} */
        const timestamps = [];

        if (word === "") {
            return { data, timestamps };
        }

        let count = 0;
        transcript?.forEach((line, index) => {
            const timestamp = line?.timestamp ?? 0;
            line?.segments?.forEach((segment) => {
                count += countWord(segment?.text, word);
            });
            if (data.length === 0 || data.at(-1) !== count || index === transcript.length - 1) {
                data.push(count);
                timestamps.push(timestamp);
            }
        });
        return { data, timestamps };
    }, [transcript, word]);
    const { data, timestamps } = transcriptToLineData();
    const maxCount = data.length > 0 ? data.at(-1) : 0;
    const duration = timestamps.length > 0 ? unixToRelative(timestamps.at(-1), startTime) : 0;
    const firstCount = data.length > 1 ? unixToRelative(timestamps.at(1), startTime) : 0;

    return (
        <>
            {isMobile ? (
                <Typography color="primary" variant="h5" component="h5" sx={{ mb: 2, wordBreak: "break-word", pl: isMobile ? 6 : 0 }}>
                    {activeTitle}
                </Typography>
            ) : (
                <Typography color="primary" variant="h4" component="h4" sx={{ mb: 2, wordBreak: "break-word", pl: isMobile ? 6 : 0 }}>
                    {activeTitle}
                </Typography>
            )}

            <Stack direction="column" width={"auto"} maxWidth={1200} minWidth={300}>
                <TextField
                    id="word-input"
                    label="Text to search"
                    variant="standard"
                    fullWidth
                    onChange={(e) => {
                        setWord(e.target.value);
                    }}
                />
                {data.length > 0 && word.length > 2 ? (
                    <Stack direction={{ xs: "column" }} spacing={{ xs: 0, md: 4 }} sx={{ width: "100%" }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <LineChart
                                xAxis={[
                                    {
                                        data: timestamps,
                                        scaleType: "time",
                                        dataKey: "time",
                                        valueFormatter: (time) => convertTime(time),
                                    },
                                ]}
                                series={[{ data: data, label: "Count", curve: "linear" }]}
                                height={isMobile ? 300 : 500}
                                skipAnimation
                            />
                        </Box>
                        <Stack direction="column">
                            <Typography sx={{ display: "flex" }}>Max count: {maxCount}</Typography>
                            <Typography sx={{ display: "flex" }}>Stream duration: {duration}</Typography>
                            <Typography sx={{ display: "flex" }}>Time to first usage: {firstCount}</Typography>
                        </Stack>
                    </Stack>
                ) : (
                    <div>
                        <Typography color="error">Text should be at least 3 characters long</Typography>
                        <LineChart
                            xAxis={[
                                {
                                    data: [],
                                    scaleType: "time",
                                    dataKey: "time",
                                    valueFormatter: (time) => unixToLocal(time),
                                },
                            ]}
                            series={[{ data: [], label: "Count" }]}
                            height={400}
                        />
                    </div>
                )}
            </Stack>
        </>
    );
}
