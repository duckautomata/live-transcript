import { Box, FormControl, MenuItem, Select, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { orange } from "@mui/material/colors";
import { useAppStore } from "../../store/store";
import { unixToLocal } from "../../logic/dateTime";

/**
 * Component for displaying the stream title.
 * If past streams are available, it renders a dropdown to switch between the live stream and past streams.
 * If no past streams are available, it renders a simple title with a tooltip.
 */
export default function ViewTitleSelection() {
    const activeTitle = useAppStore((state) => state.activeTitle);
    const pastStreams = useAppStore((state) => state.pastStreams);
    const pastStreamViewing = useAppStore((state) => state.pastStreamViewing);
    const setPastStreamViewing = useAppStore((state) => state.setPastStreamViewing);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const isLive = useAppStore((state) => state.isLive);
    const startTime = useAppStore((state) => state.startTime);
    const mediaType = useAppStore((state) => state.mediaType);

    const isMobile = useMediaQuery("(max-width:768px)");
    const liveText = isLive ? "live" : "offline";

    const handleChange = (event) => {
        const newValue = event.target.value;
        const newViewing = newValue === "live" ? null : newValue;
        setPastStreamViewing(newViewing);
        setAudioId(-1);
        setClipStartIndex(-1);
        setClipEndIndex(-1);
    };

    const streamInfoTooltip = (
        <div>
            <p style={{ margin: 0 }}>
                <strong>Stream status:</strong> {liveText}
            </p>
            <p style={{ margin: "4px 0 0" }}>
                <strong>Start Time:</strong> {unixToLocal(startTime)}
            </p>
            <p style={{ margin: "4px 0 0" }}>
                <strong>Media Available:</strong>{" "}
                {mediaType === "video" ? "Video and Audio" : mediaType === "audio" ? "Audio Only" : "None"}
            </p>
        </div>
    );

    // Sort past streams by start time descending (newest first)
    const sortedPastStreams = [...pastStreams].sort((a, b) => b.startTime - a.startTime);

    return (
        <>
            {" "}
            {sortedPastStreams.length > 0 ? (
                <FormControl variant="standard" sx={{ minWidth: 200, pl: isMobile ? 6 : 0, maxWidth: "100%" }}>
                    <Select
                        value={pastStreamViewing || "live"}
                        onChange={handleChange}
                        displayEmpty
                        inputProps={{ "aria-label": "Select Stream" }}
                        sx={{
                            fontSize: "1.5rem",
                            color: pastStreamViewing ? orange[500] : "primary.main",
                            fontWeight: 400,
                            "&:before": { borderBottom: "none" },
                            "&:after": { borderBottom: "none" },
                            "& .MuiSelect-select": { paddingRight: 4, whiteSpace: "normal" }, // increased paddingRight for arrow
                        }}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: 300,
                                },
                            },
                        }}
                    >
                        <MenuItem value="live">
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                    {activeTitle || "Live Stream"}
                                </Typography>
                                {/* Only show "Live" details if we are actually viewing the live stream in the dropdown item */}
                                <Typography variant="caption" color="text.secondary">
                                    Live
                                </Typography>
                            </Box>
                        </MenuItem>
                        {sortedPastStreams.map((stream) => (
                            <MenuItem key={stream.activeId} value={stream.activeId}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    <Typography variant="body1" sx={{ whiteSpace: "normal" }}>
                                        {stream.activeTitle || "Untitled Stream"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {`${new Date(stream.startTime * 1000).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })} ${unixToLocal(stream.startTime)}`}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) : (
                <Tooltip title={streamInfoTooltip}>
                    <Typography
                        color="primary"
                        variant="h5"
                        component="h5"
                        sx={{ wordBreak: "break-word", pl: isMobile ? 6 : 0 }}
                    >
                        {activeTitle}
                    </Typography>
                </Tooltip>
            )}
        </>
    );
}
