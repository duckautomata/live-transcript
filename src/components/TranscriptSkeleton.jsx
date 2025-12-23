import { Box, Skeleton, useMediaQuery } from "@mui/material";

/**
 * Skeleton for the TranscriptVirtual component (List of lines).
 */
export default function TranscriptSkeleton() {
    const isMobile = useMediaQuery("(max-width:768px)");
    // Calculate number of skeletons to show based on window height
    const numOfLine = Math.max(Math.ceil((window.innerHeight - 200) / 36), 1);
    const skeletonLines = Array.from(new Array(numOfLine));

    return (
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
    );
}
