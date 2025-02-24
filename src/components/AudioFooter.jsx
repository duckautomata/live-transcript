import { useContext } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "./AudioFooter.css";
import { AudioContext } from "../providers/AudioProvider";
import { TranscriptContext } from "../providers/TranscriptProvider";
import { AppBar, Box, IconButton, Toolbar, Tooltip, useTheme } from "@mui/material";
import { Close, Download } from "@mui/icons-material";
import { isMobile } from "../logic/mobile";

export default function AudioFooter({ wsKey, offset }) {
    const { audioId, setAudioId } = useContext(AudioContext);
    const { transcript } = useContext(TranscriptContext);
    const theme = useTheme();

    const playUrl = `https://dokiscripts.com/${wsKey}/audio?id=${audioId}&stream=true`;
    const downloadUrl = `https://dokiscripts.com/${wsKey}/audio?id=${audioId}`;
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
                left: isMobile ? `${offset - 24}px` : `${window.innerWidth - desktopWidth + 9}px`,
                width: isMobile ? `${window.innerWidth - 27}px` : desktopWidth,
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
