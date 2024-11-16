import { Box, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useContext, useState } from "react";
import { TranscriptContext } from "../providers/TranscriptProvider";
import { LineChart } from "@mui/x-charts";
import { unixToLocal } from "../logic/dateTime";
import "./StreamWordCount.css";

export const countWord = (text, word) => {
    if (text === undefined || typeof text !== "string" || word.length === 0) {
        return 0;
    }

    return text.split(word.toLowerCase()).length - 1;
};

export default function StreamWordCount() {
    const { transcript } = useContext(TranscriptContext);
    const [word, setWord] = useState("");

    const transcriptToLineData = useCallback(() => {
        // Each index in the data array is a specific line in the transcript.
        // id 0 = first line
        // The value is equal to the sum up to and including that line. So it would be data[i-1] + lineSum
        const data = [];
        const timestamps = [];

        if (word === "") {
            return { data, timestamps };
        }

        let count = 0;
        transcript?.forEach((line, index) => {
            const timestamp = line?.segments?.[0]?.timestamp ?? 0;
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
    const durationSec = timestamps.length > 0 ? timestamps.at(-1) - timestamps.at(0) : 0;
    const durationMin = Math.floor(durationSec / 60.0);
    const durationRemainingSec = durationSec % 60;
    const firstCountSec = data.length > 1 ? timestamps.at(1) - timestamps.at(0) : 0;

    return (
        <Stack direction="column" sx={{ width: "60vw", minWidth: 300 }}>
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
                                    valueFormatter: (time) => unixToLocal(time),
                                },
                            ]}
                            series={[{ data: data, label: "Count", curve: "linear" }]}
                            height={window.innerWidth < 600 ? 300 : 500}
                            skipAnimation
                        />
                    </Box>
                    <Stack direction="column">
                        <Typography sx={{ display: "flex" }}>Max Count: {maxCount}</Typography>
                        <Typography sx={{ display: "flex" }}>
                            Transcript Duration: {durationMin} minutes {durationRemainingSec} seconds
                        </Typography>
                        <Typography sx={{ display: "flex" }}>
                            Time to first usage: {(firstCountSec / 60.0).toFixed(2)} minutes
                        </Typography>
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
    );
}
