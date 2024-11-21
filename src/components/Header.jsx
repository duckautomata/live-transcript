import { useContext, useState } from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { GitHub, QuestionMark, Settings } from "@mui/icons-material";
import { SettingContext } from "../providers/SettingProvider";
import SettingsMenu from "./SettingsMenu";
import HelpPopup from "./HelpPopup";

export default function Header() {
    const { wsKey } = useContext(SettingContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const [helpOpen, setHelpOpen] = useState(false);

    const handleSettingsOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="fixed">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "left" }}>
                    {wsKey.charAt(0).toUpperCase() + wsKey.slice(1)}&#39;s Live Transcript
                </Typography>
                <IconButton color="inherit" title="help" onClick={() => setHelpOpen(true)}>
                    <QuestionMark />
                </IconButton>
                <IconButton
                    color="inherit"
                    href="https://github.com/duckautomata/live-transcript"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <GitHub />
                </IconButton>
                <IconButton color="inherit" onClick={handleSettingsOpen}>
                    <Settings />
                </IconButton>
                <SettingsMenu anchorEl={anchorEl} handleSettingsClose={handleSettingsClose} />
                <HelpPopup open={helpOpen} setOpen={setHelpOpen} />
            </Toolbar>
        </AppBar>
    );
}
