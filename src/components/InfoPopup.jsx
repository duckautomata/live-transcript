import { useEffect, useState, useMemo } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { server, keys } from "../config";

/* global __BUILD_TIME__ */

const formatDate = (timestamp) => {
    if (!timestamp) return "Never";
    if (timestamp === 0) return "Never";

    let date;
    if (typeof timestamp === "string") {
        date = new Date(timestamp);
    } else {
        // Assume timestamp is in seconds if it's small, ms if large.
        // Current unix seconds is ~1.7e9. Ms is ~1.7e12.
        // If it's < 1e11 (100 billion), it's likely seconds.
        date = new Date(timestamp < 100000000000 ? timestamp * 1000 : timestamp);
    }
    return date.toLocaleString();
};

const timeAgo = (timestamp) => {
    if (!timestamp || timestamp === 0) return "";

    let date;
    if (typeof timestamp === "string") {
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp < 100000000000 ? timestamp * 1000 : timestamp);
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
};

export default function InfoPopup({ open, setOpen }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            fetch(`${server}/status`)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    setData(data);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [open]);

    const handleClose = () => {
        setOpen(false);
    };

    const usableKeys = keys();
    const filteredWorkers = useMemo(() => {
        if (!data?.workers) return [];
        return data.workers.filter((worker) => usableKeys.includes(worker.channelKey));
    }, [data, usableKeys]);

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="info-dialog-title" maxWidth="md" fullWidth>
            <DialogTitle id="info-dialog-title">System Info</DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && (
                    <Typography color="error" align="center">
                        Error: {error}
                    </Typography>
                )}
                {data && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {/* UI Info */}
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                UI
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                <Typography variant="body1">
                                    <strong>Build Time:</strong> {formatDate(__BUILD_TIME__)}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Server Info */}
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Server
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                <Typography variant="body1">
                                    <strong>Version:</strong> {data.server?.version || "Unknown"}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Build Time:</strong> {formatDate(data.server?.buildTime)}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Workers Info */}
                        <Paper elevation={2} sx={{ p: 0, overflow: "hidden" }}>
                            <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                                Workers
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow
                                            sx={{
                                                backgroundColor: (theme) =>
                                                    theme.palette.mode === "light" ? "grey.200" : "grey.800",
                                            }}
                                        >
                                            <TableCell>Channel Key</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Last Seen</TableCell>
                                            <TableCell>Version</TableCell>
                                            <TableCell>Build Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredWorkers.map((worker) => (
                                            <TableRow key={worker.channelKey}>
                                                <TableCell component="th" scope="row">
                                                    {worker.channelKey}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={worker.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                                                        label={worker.isActive ? "Active" : "Inactive"}
                                                        color={worker.isActive ? "success" : "default"}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(worker.lastSeen)}
                                                    <br />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {timeAgo(worker.lastSeen)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{worker.workerVersion}</TableCell>
                                                <TableCell>{formatDate(worker.workerBuildTime)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredWorkers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    No workers found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
