import { useContext } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControlLabel,
    Switch,
    Select,
    FormControl,
    InputLabel,
    Box,
    MenuItem, // Import Box for better layout
} from "@mui/material";
import { SettingContext } from "../providers/SettingProvider";

const SettingsPopup = ({ open, setOpen }) => {
    const { theme, timeFormat, newAtTop, enableTagHelper, setTheme, setTimeFormat, setNewAtTop, setEnableTagHelper } =
        useContext(SettingContext);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            {" "}
            {/* maxWidth for better responsiveness */}
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    {" "}
                    {/* Use Box for consistent spacing */}
                    <FormControl fullWidth variant="filled">
                        <InputLabel id="theme-select-label">Theme</InputLabel>
                        <Select
                            labelId="theme-select-label"
                            name="theme"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            <MenuItem value="light">Light</MenuItem>
                            <MenuItem value="system">System</MenuItem>
                            <MenuItem value="dark">Dark</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth variant="filled">
                        <InputLabel id="time-format-select-label">Time Format</InputLabel>
                        <Select
                            labelId="time-format-select-label"
                            name="timeFormat"
                            value={timeFormat}
                            onChange={(e) => setTimeFormat(e.target.value)}
                        >
                            <MenuItem value="relative">Relative</MenuItem>
                            <MenuItem value="local">Local</MenuItem>
                            <MenuItem value="UTC">UTC</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={newAtTop}
                                onChange={(e) => setNewAtTop(e.target.checked)}
                                name="newAtTop"
                            />
                        }
                        label="New Lines at Top"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={enableTagHelper}
                                onChange={(e) => setEnableTagHelper(e.target.checked)}
                                name="enableTagHelper"
                            />
                        }
                        label="Enable Tag Helper"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SettingsPopup;
