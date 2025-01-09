import { useContext, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HelpPopup from "./HelpPopup";
import SettingsPopup from "./SettingsPopup";
import { Construction, GitHub, Help } from "@mui/icons-material";
import { Avatar, Tooltip } from "@mui/material";
import { SettingContext } from "../providers/SettingProvider";

import dokiIcon from "../assets/icons/doki.jpg";
import mintIcon from "../assets/icons/mint.jpg";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 200;
const drawerWidthCollapsed = 60;

export default function Sidebar({ wsKey, children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { sidebarOpen, setSidebarOpen } = useContext(SettingContext);
    const [helpOpen, setHelpOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const streamers = [
        { name: "Doki", icon: <Avatar src={dokiIcon} alt="doki" sx={{ width: 32, height: 32 }} />, value: "doki" },
        { name: "Mint", icon: <Avatar src={mintIcon} alt="doki" sx={{ width: 32, height: 32 }} />, value: "mint" },
    ];
    if (import.meta.env.DEV) {
        streamers.push({
            name: "Test",
            icon: (
                <Avatar alt="test" sx={{ width: 32, height: 32 }}>
                    T
                </Avatar>
            ),
            value: "test",
        });
    }
    const pages = [
        { name: "View", icon: <LiveTvIcon />, value: "" },
        { name: "Graph", icon: <AssessmentIcon />, value: "graph" },
        { name: "Tag Fixer", icon: <Construction />, value: "tagFixer" },
    ];

    const handleCollapseToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleStreamerChange = (value) => {
        const parts = location.pathname.split("/");
        if (parts.length < 2) {
            parts.push(value);
        } else {
            parts[1] = value;
        }
        // ensures we do not get a /key (View would not show as selected), always /key/
        if (parts.length === 2) {
            parts.push("");
        }
        if (parts.join("/") !== location.pathname) {
            navigate(parts.join("/"));
        }
    };

    const handlePageChange = (value) => {
        const parts = location.pathname.split("/");
        if (parts.length === 2 && parts[1] !== "") {
            parts.push(value);
        } else if (parts.length > 2) {
            parts[2] = value;
        } else {
            return;
        }

        if (parts.join("/") !== location.pathname) {
            navigate(parts.join("/"));
        }
    };

    return (
        <Box sx={{ display: "flex" }}>
            <Drawer
                open={true}
                variant="persistent"
                sx={{
                    width: sidebarOpen ? drawerWidth : drawerWidthCollapsed,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: sidebarOpen ? drawerWidth : drawerWidthCollapsed,
                        boxSizing: "border-box",
                        overflowX: "hidden", // This is the key change
                        transition: "width 0.3s ease-in-out", // Add smooth transition
                    },
                }}
            >
                <Box sx={{ overflow: "hidden" }}>
                    <List>
                        {/* Collapse/Expand Button */}
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleCollapseToggle} sx={{ justifyContent: "center" }}>
                                <ListItemIcon sx={{ minWidth: 0 }}>
                                    <MenuIcon />
                                </ListItemIcon>
                                {sidebarOpen && <ListItemText primary="" />}
                            </ListItemButton>
                        </ListItem>
                        {/* Streamers List */}
                        <ListItemText primary="Transcripts" sx={{ ml: 1, display: sidebarOpen ? "block" : "none" }} />
                        {streamers.map((streamer) => (
                            <ListItem key={streamer.value} disablePadding>
                                <Tooltip title={sidebarOpen ? "" : streamer.name} placement="right">
                                    <ListItemButton
                                        selected={wsKey === streamer.value}
                                        onClick={() => handleStreamerChange(streamer.value)}
                                        sx={{ paddingLeft: sidebarOpen ? undefined : 2, overflow: "hidden" }}
                                    >
                                        <ListItemIcon>{streamer.icon}</ListItemIcon>
                                        {sidebarOpen && <ListItemText primary={streamer.name} />}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        ))}
                        {!sidebarOpen && <ListItem sx={{ height: 16 }} />}
                        {/* Page Selection */}
                        <ListItemText primary="Pages" sx={{ mt: 2, ml: 1, display: sidebarOpen ? "block" : "none" }} />
                        {pages.map((page) => (
                            <ListItem key={page.value} disablePadding>
                                <Tooltip title={sidebarOpen ? "" : page.name} placement="right">
                                    <ListItemButton
                                        selected={window.location.pathname.split("/")[3] === page.value}
                                        onClick={() => handlePageChange(page.value)}
                                        sx={{ paddingLeft: sidebarOpen ? undefined : 2, overflow: "hidden" }}
                                    >
                                        <ListItemIcon>{page.icon}</ListItemIcon>
                                        {sidebarOpen && <ListItemText primary={page.name} />}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        ))}
                        {/* GitHub */}
                        <ListItem disablePadding sx={{ mt: 2 }}>
                            <Tooltip title="https://github.com/duckautomata/live-transcript" placement="right">
                                <ListItemButton
                                    onClick={() => {
                                        window.open(
                                            "https://github.com/duckautomata/live-transcript",
                                            "_blank",
                                            "noopener noreferrer",
                                        );
                                    }}
                                    sx={{ paddingLeft: sidebarOpen ? undefined : 2, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <GitHub />
                                    </ListItemIcon>
                                    {sidebarOpen && <ListItemText primary="GitHub" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Help */}
                        <ListItem disablePadding>
                            <Tooltip title={sidebarOpen ? "" : "Help"} placement="right">
                                <ListItemButton
                                    onClick={() => setHelpOpen(true)}
                                    sx={{ paddingLeft: sidebarOpen ? undefined : 2, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <Help />
                                    </ListItemIcon>
                                    {sidebarOpen && <ListItemText primary="Help" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Settings */}
                        <ListItem disablePadding>
                            <Tooltip title={sidebarOpen ? "" : "Settings"} placement="right">
                                <ListItemButton
                                    onClick={() => setSettingsOpen(true)}
                                    sx={{ paddingLeft: sidebarOpen ? undefined : 2, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <SettingsIcon />
                                    </ListItemIcon>
                                    {sidebarOpen && <ListItemText primary="Settings" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    </List>
                    <SettingsPopup open={settingsOpen} setOpen={setSettingsOpen} />
                    <HelpPopup open={helpOpen} setOpen={setHelpOpen} />
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: `calc(100% - ${sidebarOpen ? drawerWidth : drawerWidthCollapsed}px)`,
                    transition: "margin-left 0.3s ease-in-out",
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
