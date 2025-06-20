import { Box, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { CloudOff } from "@mui/icons-material";

export default function StreamLogsSkeleton({ serverStatus }) {
    const isMobile = useMediaQuery("(max-width:768px)");
    const isOffline = serverStatus === "offline";
    const statusText = serverStatus === "connecting" ? "Connecting..." : "Loading Transcript...";
    const numOfLine = Math.max(Math.ceil((window.innerHeight - 200) / 36), 1);
    const skeletonLines = Array.from(new Array(numOfLine));

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
                    <div className="transcript">
                        <Box
                            sx={{
                                display: "flex",
                                width: "100%",
                                alignItems: "center",
                                justifyContent: "center",
                                mb: 3,
                            }}
                        >
                            <Skeleton variant="rounded" width={isMobile ? "100%" : "50%"} height={30} />
                        </Box>
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
                                    <Skeleton variant="circular" width={24} sx={{ mr: 1 }} />
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
