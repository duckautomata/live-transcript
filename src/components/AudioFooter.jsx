import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "./AudioFooter.css";
import { AppBar, Box, IconButton, Toolbar, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Close, Download } from "@mui/icons-material";
import { server } from "../config";
import { useAppStore } from "../store/store";

export default function AudioFooter({ wsKey, offset, width }) {
    const audioId = useAppStore((state) => state.audioId);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const transcript = useAppStore((state) => state.transcript);
    const theme = useTheme();
    const isMobile = useMediaQuery("(max-width:768px)");

    const playUrl = `${server}/${wsKey}/audio?id=${audioId}&stream=true`;
    const downloadUrl = `${server}/${wsKey}/audio?id=${audioId}`;
    const desktopWidth = 400;

    const handleClose = () => {
        setAudioId(-1);
    };

    const handleDownload = () => {
        window.open(downloadUrl, "_blank");
    };

    if (audioId < 0 || audioId >= transcript.length) {
        return null;
    }

    return (
        <AppBar
            position="fixed"
            sx={{
                top: "auto",
                bottom: 0,
                background: "green",
                left: isMobile ? `${offset - 24}px` : `${width - desktopWidth + 9}px`,
                width: isMobile ? `${width - 27}px` : desktopWidth,
            }}
        >
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: "flex" }}>
                    <AudioPlayer
                        autoPlay
                        src={playUrl}
                        showDownloadProgress
                        showFilledProgress
                        showFilledVolume
                        showJumpControls={false}
                        showSkipControls
                        style={{
                            background: theme.palette.primary.main,
                        }}
                        customAdditionalControls={[
                            <Tooltip title="Close" key="close">
                                <IconButton onClick={handleClose}>
                                    <Close style={{ color: "black" }} />
                                </IconButton>
                            </Tooltip>,
                            <Tooltip title="Download" key="download">
                                <IconButton onClick={handleDownload}>
                                    <Download style={{ color: "black" }} />
                                </IconButton>
                            </Tooltip>,
                        ]}
                        onClickNext={() =>
                            setAudioId(audioId < transcript.length - 1 ? audioId + 1 : transcript.length - 1)
                        }
                        onClickPrevious={() => setAudioId(audioId > 0 ? audioId - 1 : 0)}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
