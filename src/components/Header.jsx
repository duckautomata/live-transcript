import { useContext, useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, ButtonGroup, Button } from "@mui/material";
import { GitHub, QuestionMark, Settings } from "@mui/icons-material";
import { SettingContext } from "../providers/SettingProvider";
import SettingsMenu from "./SettingsMenu";

const Header = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { wsKey, page, setPage } = useContext(SettingContext);

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
                    {wsKey.charAt(0).toUpperCase() + wsKey.slice(1)}'s Live Transcript
                </Typography>
                <ButtonGroup variant="contained" sx={{ marginLeft: 2 }}>
                    <Button color={page === "wordCount" ? "info" : "secondary"} onClick={() => setPage("wordCount")}>
                        Word Count
                    </Button>
                    <Button color={page === "transcript" ? "info" : "secondary"} onClick={() => setPage("transcript")}>
                        Transcript
                    </Button>
                </ButtonGroup>
                <IconButton color="inherit" title="help">
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
            </Toolbar>
        </AppBar>
    );
};

export default Header;
