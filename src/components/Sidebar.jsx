import { useEffect, useState } from "react";
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
import { Construction, GitHub, Help, Home, DeveloperMode } from "@mui/icons-material";
import { Tooltip, useMediaQuery } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AudioFooter from "./AudioFooter";
import { keyIcons } from "../config";
import { useAppStore } from "../store/store";
import DevToolsPopup from "./DevToolsPopup";

/**
 * The main application sidebar containing navigation and streamers list.
 * @param {object} props
 * @param {string} props.wsKey - The current active WebSocket channel key.
 * @param {React.ReactNode} props.children - The main content area children.
 */
export default function Sidebar({ wsKey, children }) {
    const location = useLocation();
    const navigate = useNavigate();

    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const devMode = useAppStore((state) => state.devMode);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [devToolsOpen, setDevToolsOpen] = useState(false);
    const [width, setWidth] = useState(window.innerWidth);
    const isMobile = useMediaQuery("(max-width:768px)");
    const drawerWidth = isMobile ? 180 : 200; // Slightly wider on mobile for better touch targets if needed, or keep same.
    const drawerWidthCollapsed = 60;

    const pages = [
        { name: "View", icon: <LiveTvIcon />, value: "" },
        { name: "Graph", icon: <AssessmentIcon />, value: "graph" },
        { name: "Tag Fixer", icon: <Construction />, value: "tagFixer" },
    ];

    const handleCollapseToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    const handleHomeButton = () => {
        // On mobile, close sidebar when navigating
        if (isMobile) setMobileOpen(false);
        navigate("/");
        setAudioId(-1);
        setClipStartIndex(-1);
        setClipEndIndex(-1);
    };

    const handleStreamerChange = (value) => {
        // On mobile, close sidebar when navigating
        if (isMobile) setMobileOpen(false);

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
            setAudioId(-1);
            setClipStartIndex(-1);
            setClipEndIndex(-1);
        }
    };

    const handlePageChange = (value) => {
        // On mobile, close sidebar when navigating
        if (isMobile) setMobileOpen(false);

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
            setAudioId(-1);
            setClipStartIndex(-1);
            setClipEndIndex(-1);
        }
    };

    useEffect(() => {
        const updateWidth = () => {
            setWidth(window.innerWidth);
        };

        // Log initial width
        updateWidth();

        // Add resize event listener
        window.addEventListener("resize", updateWidth);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("resize", updateWidth);
        };
    }, []);


    return (
        <Box sx={{ display: "flex" }}>
            {/* Floating Hamburger for Mobile */}
            {isMobile && !mobileOpen && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 10,
                        left: 10,
                        zIndex: 1200, // Above other content
                        backgroundColor: "background.paper",
                        borderRadius: "50%",
                        boxShadow: 2,
                    }}
                >
                    <ListItemButton onClick={() => setMobileOpen(true)} sx={{ borderRadius: "50%", p: 1 }}>
                        <MenuIcon />
                    </ListItemButton>
                </Box>
            )}

            <Drawer
                open={isMobile ? mobileOpen : true}
                variant={isMobile ? "temporary" : "persistent"}
                onClose={isMobile ? () => setMobileOpen(false) : undefined}
                sx={{
                    width: isMobile ? drawerWidth : (sidebarOpen ? drawerWidth : drawerWidthCollapsed),
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: isMobile ? drawerWidth : (sidebarOpen ? drawerWidth : drawerWidthCollapsed),
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        transition: "width 0.3s ease-in-out",
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
                                {((!isMobile && sidebarOpen) || (isMobile)) && <ListItemText primary="" />}
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <Tooltip title={(!isMobile && !sidebarOpen) ? "Home" : ""} placement="right">
                                <ListItemButton
                                    onClick={handleHomeButton}
                                    sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2.4 : undefined, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <Home />
                                    </ListItemIcon>
                                    {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary="Home" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {!isMobile && !sidebarOpen && <ListItem sx={{ height: 16 }} />}
                        {/* Streamers List */}
                        <ListItemText primary="Transcripts" sx={{ ml: 1, display: ((!isMobile && sidebarOpen) || isMobile) ? "block" : "none" }} />
                        {keyIcons(32).map((streamer) => (
                            <ListItem key={streamer.value} disablePadding>
                                <Tooltip title={(!isMobile && !sidebarOpen) ? streamer.name : ""} placement="right">
                                    <ListItemButton
                                        selected={wsKey === streamer.value}
                                        onClick={() => handleStreamerChange(streamer.value)}
                                        sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2 : undefined, overflow: "hidden" }}
                                    >
                                        <ListItemIcon>{streamer.icon}</ListItemIcon>
                                        {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary={streamer.name} />}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        ))}
                        {!isMobile && !sidebarOpen && <ListItem sx={{ height: 16 }} />}
                        {/* Page Selection */}
                        <ListItemText primary="Pages" sx={{ mt: 2, ml: 1, display: ((!isMobile && sidebarOpen) || isMobile) ? "block" : "none" }} />
                        {pages.map((page) => (
                            <ListItem key={page.value} disablePadding>
                                <Tooltip title={(!isMobile && !sidebarOpen) ? page.name : ""} placement="right">
                                    <ListItemButton
                                        selected={window.location.pathname.split("/")[3] === page.value}
                                        onClick={() => handlePageChange(page.value)}
                                        sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2 : undefined, overflow: "hidden" }}
                                    >
                                        <ListItemIcon>{page.icon}</ListItemIcon>
                                        {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary={page.name} />}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        ))}
                        {/* Developer Group */}
                        {devMode && (
                            <>
                                <ListItemText
                                    primary="Developer"
                                    sx={{ mt: 2, ml: 1, display: ((!isMobile && sidebarOpen) || isMobile) ? "block" : "none" }}
                                />
                                <ListItem disablePadding>
                                    <Tooltip title={(!isMobile && !sidebarOpen) ? "Dev Tools" : ""} placement="right">
                                        <ListItemButton
                                            onClick={() => setDevToolsOpen(true)}
                                            sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2 : undefined, overflow: "hidden" }}
                                        >
                                            <ListItemIcon>
                                                <DeveloperMode />
                                            </ListItemIcon>
                                            {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary="Dev Tools" />}
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                            </>
                        )}
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
                                    sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2 : undefined, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <GitHub />
                                    </ListItemIcon>
                                    {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary="GitHub" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Help */}
                        <ListItem disablePadding>
                            <Tooltip title={(!isMobile && !sidebarOpen) ? "Help" : ""} placement="right">
                                <ListItemButton
                                    onClick={() => setHelpOpen(true)}
                                    sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2 : undefined, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <Help />
                                    </ListItemIcon>
                                    {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary="Help" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Settings */}
                        <ListItem disablePadding>
                            <Tooltip title={(!isMobile && !sidebarOpen) ? "Settings" : ""} placement="right">
                                <ListItemButton
                                    onClick={() => setSettingsOpen(true)}
                                    sx={{ paddingLeft: (!isMobile && !sidebarOpen) ? 2 : undefined, overflow: "hidden" }}
                                >
                                    <ListItemIcon>
                                        <SettingsIcon />
                                    </ListItemIcon>
                                    {((!isMobile && sidebarOpen) || isMobile) && <ListItemText primary="Settings" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    </List>
                    <SettingsPopup open={settingsOpen} setOpen={setSettingsOpen} />
                    <HelpPopup open={helpOpen} setOpen={setHelpOpen} />
                    <DevToolsPopup open={devToolsOpen} setOpen={setDevToolsOpen} />
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    padding: 1,
                    width: isMobile
                        ? "100%"
                        : `calc(97vw - ${sidebarOpen ? drawerWidth : drawerWidthCollapsed}px)`,
                    transition: "width 0.3s ease-in-out, margin-left 0.3s ease-in-out",
                }}
            >
                {children}
                <AudioFooter wsKey={wsKey} offset={isMobile ? 0 : (sidebarOpen ? drawerWidth : drawerWidthCollapsed)} width={width} />
            </Box>
        </Box>
    );
}
