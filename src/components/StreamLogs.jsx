import { Typography } from "@mui/material";
import { useContext, useEffect } from "react";
import { TranscriptContext } from "../providers/TranscriptProvider";
import Line from "./Line";
import { SettingContext } from "../providers/SettingProvider";

export default function StreamLogs() {
    const { activeTitle, isLive, transcript } = useContext(TranscriptContext);
    const { newAtTop, wsKey } = useContext(SettingContext);

    const liveText = isLive ? "live" : "offline";

    const mapArray = [...transcript];
    if (newAtTop) {
        // Assume transcript is already sorted
        mapArray.reverse();
    }

    return (
        <>
            <Typography color="primary" variant="h4" component="h1" sx={{ mb: 2 }}>
                {activeTitle}
            </Typography>
            <Typography color="secondary" variant="h6" component="h1" sx={{ mb: 2 }} id={liveText}>
                Stream is {liveText}.
            </Typography>
            <hr />
            <div className="transcript">
                {mapArray.map((line, index) => (
                    <Line
                        key={line?.id}
                        id={line?.id}
                        segments={line?.segments}
                        isEven={index % 2 === 0}
                        audioUrl={`https://dokiscripts.com/${wsKey}/audio?id=${line?.id}`}
                    />
                ))}
            </div>
        </>
    );
}
