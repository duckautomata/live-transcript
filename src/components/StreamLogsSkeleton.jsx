import { Box, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { CloudOff } from "@mui/icons-material";

export default function StreamLogsSkeleton({ serverStatus }) {
    const isMobile = useMediaQuery("(max-width:768px)");
    const isOffline = serverStatus === "offline";
    const statusText = serverStatus === "connecting" ? "Connecting..." : "Loading Transcript...";
    const skeletonLines = Array.from(new Array(15));

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
                <Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Skeleton variant="text" width="90%" height={isMobile ? 40 : 50} sx={{ mb: 1 }} />
                        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                            {statusText}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", mb: 2 }}>
                        <Skeleton variant="rounded" width={isMobile ? "100%" : "50%"} height={40} />
                    </Box>
                    <hr />
                    <div className="transcript">
                        {skeletonLines.map((_, index) => {
                            const opacity = Math.max(1 - index / skeletonLines.length, 0.15);
                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mb: 1.5,
                                        opacity: opacity,
                                    }}
                                >
                                    <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                                    <Skeleton variant="text" width={80} sx={{ mr: 1 }} />
                                    <Skeleton variant="text" width="100%" />
                                </Box>
                            );
                        })}
                    </div>
                </Box>
            )}
        </>
    );
}
