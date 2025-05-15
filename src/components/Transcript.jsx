import { Box, IconButton, InputAdornment, Pagination, TextField, Typography, useMediaQuery } from "@mui/material";
import { useContext, useRef, useState } from "react";
import { TranscriptContext } from "../providers/TranscriptProvider";
import Line from "./Line";
import { SettingContext } from "../providers/SettingProvider";
import LineMenu from "./LineMenu";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";

export default function Transcript({ wsKey, searchTerm, setSearchTerm }) {
    const listRef = useRef(null);
    const { startTime, transcript } = useContext(TranscriptContext);
    const { newAtTop, timeFormat, density } = useContext(SettingContext);
    const [ jumpId, setJumpId ] = useState(-1);

    const mapArray = transcript.filter((line) => {
        let text = "";
        line?.segments?.forEach((segment) => {
            text += segment.text + " ";
        });
        return text.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (newAtTop) {
        mapArray.reverse();
    }

    const jumpToLine = (id) => {
        setSearchTerm("");
        setJumpId(id)
    };

    if (jumpId >= 0 && searchTerm === "") {
        const index = mapArray.findIndex((item) => item.id === jumpId);
        setJumpId(-1);
        setTimeout(() => {
            listRef.current.scrollToItem(index, "start");
        }, 10);
    }

    const Row = ({ index, style }) => {
        const line = mapArray[index];

        return (
            <div style={style}>
                <Line
                    key={line?.id}
                    id={line?.id}
                    segments={line?.segments}
                    timeFormat={timeFormat}
                    startTime={startTime}
                    density={density}
                />
            </div>
        );
    };

    return (
        <>
            <LineMenu wsKey={wsKey} jumpToLine={jumpToLine} />
            <div className="transcript" style={{ flex: "1 1 auto", height: "100%", width: "100%" }}>
                <AutoSizer>
                    {({ height, width }) => {
                        if (width === 0 || height === 0) {
                            return null;
                        }

                        return (
                            <FixedSizeList
                                ref={listRef}
                                width={width}
                                height={height}
                                itemCount={mapArray.length}
                                itemSize={40}
                                overscanCount={10}
                            >
                                {Row}
                            </FixedSizeList>
                        );
                    }}
                </AutoSizer>
            </div>
        </>
    );
}
