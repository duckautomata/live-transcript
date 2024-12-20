import { useContext } from "react";
import { Menu, MenuItem, FormControlLabel, Switch, Select, FormControl, InputLabel } from "@mui/material";
import { SettingContext } from "../providers/SettingProvider";

const SettingsMenu = ({ anchorEl, handleSettingsClose }) => {
    const {
        theme,
        newAtTop,
        enableTagHelper,
        wsKey,
        audioDownloader,
        setTheme,
        setNewAtTop,
        setEnableTagHelper,
        setWsKey,
        setAudioDownloader,
    } = useContext(SettingContext);

    return (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleSettingsClose}>
            <MenuItem>
                <FormControl fullWidth variant="filled">
                    <InputLabel id="theme-select-label">Theme</InputLabel>
                    <Select
                        labelId="theme-select-label"
                        name="theme"
                        value={theme}
                        onChange={(e) => {
                            setTheme(e.target.value);
                        }}
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="system">System</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                    </Select>
                </FormControl>
            </MenuItem>
            <MenuItem>
                <FormControlLabel
                    control={
                        <Switch
                            checked={newAtTop}
                            onChange={(e) => {
                                setNewAtTop(e.target.checked);
                            }}
                            name="newAtTop"
                        />
                    }
                    label="New Lines at Top"
                />
            </MenuItem>
            <MenuItem>
                <FormControlLabel
                    control={
                        <Switch
                            checked={enableTagHelper}
                            onChange={(e) => {
                                setEnableTagHelper(e.target.checked);
                            }}
                            name="enableTagHelper"
                        />
                    }
                    label="Enable Tag Helper"
                />
            </MenuItem>
            <MenuItem>
                <FormControlLabel
                    control={
                        <Switch
                            checked={audioDownloader}
                            onChange={(e) => {
                                setAudioDownloader(e.target.checked);
                            }}
                            name="audioDownloader"
                        />
                    }
                    label="Beta: Audio Downloader"
                />
            </MenuItem>
            <MenuItem>
                <FormControl fullWidth variant="filled">
                    <InputLabel id="wsKey-select-label">Streamer</InputLabel>
                    <Select
                        labelId="wsKey-select-label"
                        name="wsKey"
                        value={wsKey}
                        onChange={(e) => {
                            setWsKey(e.target.value);
                        }}
                    >
                        <MenuItem value="doki">Doki</MenuItem>
                        {import.meta.env.DEV && <MenuItem value="test">Test</MenuItem>}
                    </Select>
                </FormControl>
            </MenuItem>
        </Menu>
    );
};

export default SettingsMenu;
