import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "./AudioFooter.css";
import { AppBar, Box, IconButton, Toolbar, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Close, Download } from "@mui/icons-material";
import { useAppStore } from "../store/store";
import { downloadAudioUrl, playAudioUrl } from "../logic/mediaUrls";

/** Stable empty list so the footer does not re-render for every new line while nothing is playing. */
const EMPTY_TRANSCRIPT = [];

/**
 * A floating footer providing audio controls and playback.
 * @param {object} props
 * @param {string} props.wsKey - The WebSocket channel key.
 */
export default function AudioFooter({ wsKey }) {
    const audioId = useAppStore((state) => state.audioId);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const mediaBaseUrl = useAppStore((state) => state.mediaBaseUrl);
    const selectedId = useAppStore((state) => state.pastStreamViewing || state.streamId);
    // Only subscribe to the (large) transcript while something is playing.
    const activeTranscript = useAppStore((state) =>
        state.audioId < 0 ? EMPTY_TRANSCRIPT : state.pastStreamViewing ? state.pastStreamTranscript : state.transcript,
    );
    const theme = useTheme();
    const isMobile = useMediaQuery("(max-width:768px)");

    const desktopWidth = 400;

    // Line ids are not guaranteed to equal array indexes (holes, deleted lines, past streams), so the
    // neighbours are looked up by position in the list.
    const activeIndex = audioId < 0 ? -1 : activeTranscript.findIndex((line) => line.id === audioId);
    const activeLine = activeIndex === -1 ? undefined : activeTranscript[activeIndex];
    const playUrl = playAudioUrl(mediaBaseUrl, wsKey, selectedId, activeLine?.fileId);

    if (!activeLine || !playUrl) {
        return null;
    }

    const downloadUrl = downloadAudioUrl(mediaBaseUrl, wsKey, selectedId, activeLine.fileId, audioId);
    const prevLine = activeTranscript[activeIndex - 1];
    const nextLine = activeTranscript[activeIndex + 1];
    const prevPlayUrl = playAudioUrl(mediaBaseUrl, wsKey, selectedId, prevLine?.fileId);
    const nextPlayUrl = playAudioUrl(mediaBaseUrl, wsKey, selectedId, nextLine?.fileId);

    const handleClose = () => {
        setAudioId(-1);
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                top: "auto",
                bottom: 0,
                left: "auto",
                right: 0,
                width: isMobile ? "100%" : desktopWidth,
            }}
        >
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: "flex" }}>
                    {prevPlayUrl && <audio src={prevPlayUrl} preload="auto" muted style={{ display: "none" }} />}
                    {nextPlayUrl && <audio src={nextPlayUrl} preload="auto" muted style={{ display: "none" }} />}
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
                                <IconButton onClick={handleClose} aria-label="Close audio player">
                                    <Close style={{ color: "black" }} />
                                </IconButton>
                            </Tooltip>,
                            <Tooltip title="Download" key="download">
                                <IconButton
                                    component="a"
                                    href={downloadUrl}
                                    aria-label="Download audio"
                                    data-testid="audio-footer-download"
                                >
                                    <Download style={{ color: "black" }} />
                                </IconButton>
                            </Tooltip>,
                        ]}
                        onClickNext={() => setAudioId(nextLine?.id ?? audioId)}
                        onClickPrevious={() => setAudioId(prevLine?.id ?? audioId)}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
