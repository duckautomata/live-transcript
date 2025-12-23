import { Box, Skeleton, Typography } from "@mui/material";
import { CloudOff } from "@mui/icons-material";
import TranscriptSkeleton from "./TranscriptSkeleton";

/**
 * Skeleton for the View component.
 * Handles offline/connecting states and renders TranscriptSkeleton.
 * @param {object} props
 * @param {'online' | 'loading' | 'connecting' | 'offline'} [props.serverStatus] - Current server connection status.
 */
export default function ViewSkeleton({ serverStatus = "loading" }) {
    const isOffline = serverStatus === "offline";
    const statusText = serverStatus === "connecting" ? "Connecting..." : "Loading Transcript...";

    return (
        <>
            {isOffline ? (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        height: "50vh",
                    }}
                >
                    <CloudOff color="error" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                        Connection Failed
                    </Typography>
                    <Typography color="text.secondary">Could not establish a connection to the server.</Typography>
                </Box>
            ) : (
                <Box sx={{ height: "95vh", overflow: "hidden" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Skeleton variant="text" width="90%" height={40} sx={{ mb: 1 }} />
                        <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
                            {statusText}
                        </Typography>
                    </Box>
                    <hr />
                    <TranscriptSkeleton />
                </Box>
            )}
        </>
    );
}
