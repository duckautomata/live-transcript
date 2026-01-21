import {
    Box,
    Card,
    CardContent,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useCallback, useState } from "react";
import { LineChart } from "@mui/x-charts";
import { unixToLocal, unixToRelative, unixToUTC } from "../../logic/dateTime";
import "./StreamWordCount.css";
import { countWord } from "../../logic/wordCount";
import { useAppStore } from "../../store/store";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";

/**
 * A reusable component for displaying a statistic with an icon.
 */
function StatCard({ title, value, icon, color }) {
    return (
        <Card variant="outlined" sx={{ height: "100%", bgcolor: "background.paper" }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: `${color}15`,
                            color: color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {icon}
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {value}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

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
        const data = [];
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
    const duration = timestamps.length > 0 ? unixToRelative(timestamps.at(-1), startTime) : "0s";
    const firstCount = data.length > 1 ? unixToRelative(timestamps.at(1), startTime) : "N/A";

    return (
        <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, margin: "0 auto" }}>
            <Typography
                color="primary"
                variant={isMobile ? "h5" : "h4"}
                component="h1"
                sx={{ mb: 4, fontWeight: 700, pl: isMobile ? 6 : 0 }}
            >
                {activeTitle}
            </Typography>

            <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <TextField
                    id="word-input"
                    label="Search text usage"
                    placeholder="e.g. text to search"
                    variant="outlined"
                    fullWidth
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    sx={{ mb: 4 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: word && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setWord("")}>
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {data.length > 0 && word.length >= 3 ? (
                    <Box>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title="TOTAL COUNT"
                                    value={maxCount}
                                    icon={<TrendingUpIcon />}
                                    color="#20A79A"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title="STREAM DURATION"
                                    value={duration}
                                    icon={<TimerIcon />}
                                    color="#8093E0"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title="TIME TO FIRST"
                                    value={firstCount}
                                    icon={<SpeedIcon />}
                                    color="#FF9800"
                                />
                            </Grid>
                        </Grid>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
                            <LineChart
                                xAxis={[
                                    {
                                        data: timestamps,
                                        scaleType: "time",
                                        dataKey: "time",

                                        valueFormatter: (time) => convertTime(time),
                                    },
                                ]}
                                series={[
                                    {
                                        data: data,
                                        label: `Usage of "${word}"`,
                                        area: false,
                                        color: "#20A79A",
                                        showMark: false,
                                        curve: "linear",
                                    },
                                ]}
                                height={isMobile ? 300 : 500}
                                margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
                            />
                        </Paper>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            py: 10,
                            textAlign: "center",
                            color: "text.secondary",
                        }}
                    >
                        <SearchIcon sx={{ fontSize: 60, mb: 2, opacity: 0.2 }} />
                        <Typography variant="h6" gutterBottom>
                            {word.length > 0 && word.length < 3 ? "Search term too short" : "No data to display"}
                        </Typography>
                        <Typography variant="body2">
                            {word.length > 0 && word.length < 3
                                ? "Please enter at least 3 characters to search."
                                : "Enter a word above to visualize its usage frequency over time."}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
