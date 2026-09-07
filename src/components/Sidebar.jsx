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
import { Construction, GitHub, Help, Home, DeveloperMode, Info, QueryBuilder } from "@mui/icons-material";
import { Tooltip, useMediaQuery } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AudioFooter from "./AudioFooter";
import { keyIcons } from "../config";
import { useAppStore } from "../store/store";
import { currentPage, pagePath } from "../logic/links";

const GITHUB_URL = "https://github.com/duckautomata/live-transcript";

/**
 * The main application sidebar containing navigation and streamers list.
 * Navigation items are real links so they can be opened in a new tab (middle-click / ctrl+click).
 * @param {object} props
 * @param {string} props.wsKey - The current active WebSocket channel key.
 * @param {React.ReactNode} props.children - The main content area children.
 */
export default function Sidebar({ wsKey, children }) {
    const { pathname } = useLocation();

    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const setAudioId = useAppStore((state) => state.setAudioId);
    const setClipStartIndex = useAppStore((state) => state.setClipStartIndex);
    const setClipEndIndex = useAppStore((state) => state.setClipEndIndex);
    const devMode = useAppStore((state) => state.devMode);

    const [mobileOpen, setMobileOpen] = useState(false);
    const setHelpOpen = useAppStore((state) => state.setHelpOpen);
    const setInfoOpen = useAppStore((state) => state.setInfoOpen);
    const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
    const setDevToolsOpen = useAppStore((state) => state.setDevToolsOpen);
    const isMobile = useMediaQuery("(max-width:768px)");
    const drawerWidth = isMobile ? 180 : 200; // Slightly wider on mobile for better touch targets if needed, or keep same.
    const drawerWidthCollapsed = 60;

    // On desktop the drawer can be collapsed to icons only; on mobile it is either fully open or hidden.
    const showLabels = isMobile || sidebarOpen;
    const collapsed = !isMobile && !sidebarOpen;
    const activePage = currentPage(pathname);

    const pages = [
        { name: "View", icon: <LiveTvIcon />, value: "", testId: "page-button-view" },
        { name: "Graph", icon: <AssessmentIcon />, value: "graph", testId: "page-button-graph" },
        { name: "Tracker", icon: <QueryBuilder />, value: "track", testId: "page-button-track" },
        { name: "Tag Formatter", icon: <Construction />, value: "tagFixer", testId: "page-button-tagFixer" },
    ];

    // Leaving a page ends audio playback and any half-built clip. Keyed on the path so it also runs
    // for back/forward navigation and links opened from anywhere, not just sidebar clicks.
    useEffect(() => {
        setAudioId(-1);
        setClipStartIndex(-1);
        setClipEndIndex(-1);
    }, [pathname, setAudioId, setClipStartIndex, setClipEndIndex]);

    const handleCollapseToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    /** On mobile the drawer covers the page, so close it once a link is followed. */
    const closeMobileDrawer = () => {
        if (isMobile) setMobileOpen(false);
    };

    const itemButtonSx = {
        minHeight: 48,
        justifyContent: sidebarOpen ? "initial" : "center",
        px: 2.5,
        overflow: "hidden",
    };

    const itemIconSx = {
        minWidth: 0,
        mr: sidebarOpen ? 3 : "auto",
        justifyContent: "center",
    };

    const groupLabelSx = {
        mt: 2,
        ml: 1,
        display: showLabels ? "block" : "none",
    };

    /** Tooltip text shown next to an icon-only item; hidden when the label is visible. */
    const tooltipFor = (name) => (collapsed ? name : "");

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
                    <ListItemButton
                        data-testid="sidebar-open-button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open sidebar"
                        sx={{ borderRadius: "50%", p: 1 }}
                    >
                        <MenuIcon />
                    </ListItemButton>
                </Box>
            )}

            <Drawer
                open={isMobile ? mobileOpen : true}
                variant={isMobile ? "temporary" : "persistent"}
                onClose={isMobile ? () => setMobileOpen(false) : undefined}
                sx={{
                    width: isMobile ? drawerWidth : sidebarOpen ? drawerWidth : drawerWidthCollapsed,
                    flexShrink: 0,
                    // Animate the reserved space in step with the (fixed) drawer paper so content does not jump
                    transition: "width 0.3s ease-in-out",
                    "& .MuiDrawer-paper": {
                        width: isMobile ? drawerWidth : sidebarOpen ? drawerWidth : drawerWidthCollapsed,
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        transition: "width 0.3s ease-in-out",
                    },
                }}
            >
                <Box component="nav" aria-label="Main" sx={{ overflowY: "auto", overflowX: "hidden", height: "100%" }}>
                    <List>
                        {/* Collapse/Expand Button */}
                        <ListItem disablePadding>
                            <ListItemButton
                                data-testid="sidebar-collapse-button"
                                onClick={handleCollapseToggle}
                                aria-label="Toggle sidebar"
                                aria-expanded={isMobile ? mobileOpen : sidebarOpen}
                                sx={{ justifyContent: "center" }}
                            >
                                <ListItemIcon sx={{ minWidth: 0 }}>
                                    <MenuIcon />
                                </ListItemIcon>
                                {showLabels && <ListItemText primary="" />}
                            </ListItemButton>
                        </ListItem>
                        {/* Home */}
                        <ListItem disablePadding>
                            <Tooltip title={tooltipFor("Home")} placement="right">
                                <ListItemButton
                                    component={RouterLink}
                                    to="/"
                                    selected={pathname === "/"}
                                    aria-current={pathname === "/" ? "page" : undefined}
                                    onClick={closeMobileDrawer}
                                    data-testid="page-button-home"
                                    sx={itemButtonSx}
                                >
                                    <ListItemIcon sx={itemIconSx}>
                                        <Home />
                                    </ListItemIcon>
                                    {showLabels && <ListItemText primary="Home" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {collapsed && <ListItem sx={{ height: 16 }} />}
                        {/* Streamers List */}
                        {wsKey && (
                            <>
                                <ListItemText
                                    primary="Transcripts"
                                    sx={{ ml: 1, display: showLabels ? "block" : "none" }}
                                />
                                {keyIcons(32, devMode)
                                    .filter((streamer) => streamer.value === wsKey)
                                    .map((streamer) => (
                                        <ListItem key={streamer.value} disablePadding>
                                            <Tooltip title={tooltipFor(streamer.name)} placement="right">
                                                <ListItemButton
                                                    component={RouterLink}
                                                    to={pagePath(streamer.value, activePage)}
                                                    replace
                                                    selected={wsKey === streamer.value}
                                                    onClick={closeMobileDrawer}
                                                    sx={itemButtonSx}
                                                >
                                                    <ListItemIcon sx={itemIconSx}>{streamer.icon}</ListItemIcon>
                                                    {showLabels && <ListItemText primary={streamer.name} />}
                                                </ListItemButton>
                                            </Tooltip>
                                        </ListItem>
                                    ))}
                                {collapsed && <ListItem sx={{ height: 16 }} />}
                            </>
                        )}
                        {/* Page Selection Only when key is set */}
                        {wsKey && (
                            <>
                                <ListItemText primary="Pages" sx={groupLabelSx} />
                                {pages.map((page) => {
                                    const to = pagePath(wsKey, page.value);
                                    const isActive = activePage === page.value;
                                    return (
                                        <ListItem key={page.value} disablePadding>
                                            <Tooltip title={tooltipFor(page.name)} placement="right">
                                                <ListItemButton
                                                    component={RouterLink}
                                                    to={to}
                                                    replace={isActive}
                                                    selected={isActive}
                                                    aria-current={isActive ? "page" : undefined}
                                                    onClick={closeMobileDrawer}
                                                    sx={itemButtonSx}
                                                    data-testid={page.testId}
                                                >
                                                    <ListItemIcon sx={itemIconSx}>{page.icon}</ListItemIcon>
                                                    {showLabels && <ListItemText primary={page.name} />}
                                                </ListItemButton>
                                            </Tooltip>
                                        </ListItem>
                                    );
                                })}
                            </>
                        )}
                        {/* Developer Group */}
                        {devMode && (
                            <>
                                <ListItemText primary="Developer" sx={groupLabelSx} />
                                <ListItem disablePadding>
                                    <Tooltip title={tooltipFor("Dev Tools")} placement="right">
                                        <ListItemButton
                                            data-testid="page-button-devTools"
                                            onClick={() => setDevToolsOpen(true)}
                                            sx={itemButtonSx}
                                        >
                                            <ListItemIcon sx={itemIconSx}>
                                                <DeveloperMode />
                                            </ListItemIcon>
                                            {showLabels && <ListItemText primary="Dev Tools" />}
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                            </>
                        )}
                        {/* GitHub */}
                        <ListItem disablePadding sx={{ mt: 2 }}>
                            <Tooltip title="Source code on GitHub (opens in a new tab)" placement="right" describeChild>
                                <ListItemButton
                                    component="a"
                                    href={GITHUB_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="GitHub"
                                    data-testid="page-button-github"
                                    sx={itemButtonSx}
                                >
                                    <ListItemIcon sx={itemIconSx}>
                                        <GitHub />
                                    </ListItemIcon>
                                    {showLabels && <ListItemText primary="GitHub" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Help */}
                        <ListItem disablePadding>
                            <Tooltip title={tooltipFor("Help")} placement="right">
                                <ListItemButton onClick={() => setHelpOpen(true)} sx={itemButtonSx}>
                                    <ListItemIcon sx={itemIconSx}>
                                        <Help />
                                    </ListItemIcon>
                                    {showLabels && <ListItemText primary="Help" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Info */}
                        <ListItem disablePadding>
                            <Tooltip title={tooltipFor("Info")} placement="right">
                                <ListItemButton onClick={() => setInfoOpen(true)} sx={itemButtonSx}>
                                    <ListItemIcon sx={itemIconSx}>
                                        <Info />
                                    </ListItemIcon>
                                    {showLabels && <ListItemText primary="Info" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                        {/* Settings */}
                        <ListItem disablePadding>
                            <Tooltip title={tooltipFor("Settings")} placement="right">
                                <ListItemButton onClick={() => setSettingsOpen(true)} sx={itemButtonSx}>
                                    <ListItemIcon sx={itemIconSx}>
                                        <SettingsIcon />
                                    </ListItemIcon>
                                    {showLabels && <ListItemText primary="Settings" />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            {/* The main column fills the space next to the drawer; pages are capped to a comfortable reading
                width and centred inside it, so the layout does not drift away from the drawer on wide screens. */}
            <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: "100%", padding: 1 }}>
                <Box sx={{ maxWidth: 1280, mx: "auto" }}>{children}</Box>
                <AudioFooter wsKey={wsKey} />
            </Box>
        </Box>
    );
}
