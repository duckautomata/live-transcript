import { TextField } from "@mui/material";
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

    return (
        <>
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
                <LineChart
                    xAxis={[
                        {
                            data: timestamps,
                            scaleType: "band",
                            dataKey: "time",
                            valueFormatter: (time) => unixToLocal(time),
                        },
                    ]}
                    series={[{ data: data, label: "Count" }]}
                    height={300}
                    width={800}
                    margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
                ></LineChart>
            ) : (
                <p>Text should be at least 3 characters long</p>
            )}
        </>
    );
}
