import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { BrokenImage } from "@mui/icons-material";

const FrameImage = ({ src, alt, style, ...props }) => {
    const [error, setError] = useState(false);
    const [prevSrc, setPrevSrc] = useState(src);

    if (src !== prevSrc) {
        setPrevSrc(src);
        setError(false);
    }

    if (error) {
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.disabledBackground",
                    color: "text.secondary",
                }}
            >
                <BrokenImage sx={{ fontSize: 40 }} />
                <Typography variant="body2">Image Unavailable</Typography>
            </Box>
        );
    }

    return <img src={src} alt={alt} onError={() => setError(true)} style={style} {...props} />;
};

export default FrameImage;
