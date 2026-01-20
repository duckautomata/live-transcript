import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "./AudioFooter.css";
import { AppBar, Box, IconButton, Toolbar, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Close, Download } from "@mui/icons-material";
import { useAppStore } from "../store/store";
import { downloadAudioUrl, playAudioUrl } from "../logic/mediaUrls";

/**
 * A floating footer providing audio controls and playback.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 * @param {number} props.width - The available width.
 */
export default function AudioFooter({ wsKey, width }) {
    const audioId = useAppStore((state) => state.audioId);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const mediaBaseUrl = useAppStore((state) => state.mediaBaseUrl);
    const transcript = useAppStore((state) => state.transcript);
    const pastStreamViewing = useAppStore((state) => state.pastStreamViewing);
    const pastStreamTranscript = useAppStore((state) => state.pastStreamTranscript);
    const activeId = useAppStore((state) => state.activeId);
    const selectedId = pastStreamViewing || activeId;
    const activeTranscript = pastStreamViewing ? pastStreamTranscript : transcript;
    const activeLine = activeTranscript.find((line) => line.id === audioId);
    const theme = useTheme();
    const isMobile = useMediaQuery("(max-width:768px)");

    const playUrl = playAudioUrl(mediaBaseUrl, wsKey, selectedId, activeLine?.fileId);
    const downloadUrl = downloadAudioUrl(mediaBaseUrl, wsKey, selectedId, activeLine?.fileId, audioId);
    const desktopWidth = 400;

    const handleClose = () => {
        setAudioId(-1);
    };

    const handleDownload = () => {
        window.open(downloadUrl, "_blank");
    };

    if (!playUrl || audioId < 0 || audioId >= activeTranscript.length) {
        return null;
    }

    return (
        <AppBar
            position="fixed"
            sx={{
                top: "auto",
                bottom: 0,
                background: "green",
                left: isMobile ? 0 : `${width - desktopWidth + 9}px`,
                width: isMobile ? "100%" : desktopWidth,
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
                            setAudioId(
                                audioId < activeTranscript.length - 1 ? audioId + 1 : activeTranscript.length - 1,
                            )
                        }
                        onClickPrevious={() => setAudioId(audioId > 0 ? audioId - 1 : 0)}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
