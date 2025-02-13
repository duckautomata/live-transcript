import { List, ListItem, ListItemText, Typography, Box, ListItemButton, ListItemIcon, Avatar } from "@mui/material";

import dokiIcon from "../assets/icons/doki.jpg";
import mintIcon from "../assets/icons/mint.jpg";
import junaIcon from "../assets/icons/juna.jpg";
import { useNavigate } from "react-router-dom";
import { isMobile } from "../logic/mobile";

export default function Home() {
    const navigate = useNavigate();
    const streamers = [
        { name: "Doki", icon: <Avatar src={dokiIcon} alt="doki" />, value: "doki" },
        { name: "Mint", icon: <Avatar src={mintIcon} alt="mint" />, value: "mint" },
        { name: "Juna", icon: <Avatar src={junaIcon} alt="juna" />, value: "juna" },
    ];
    if (import.meta.env.DEV) {
        streamers.push({ name: "Test", icon: <Avatar alt="test">T</Avatar>, value: "test" });
    }

    const handleStreamerChange = (value) => {
        navigate(`${value}/`);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4, gap: 2 }}>
            {isMobile ? (
                <Typography color="primary" variant="h4" component="h4" gutterBottom>
                    Live Transcripts
                </Typography>
            ) : (
                <Typography color="primary" variant="h2" component="h2" gutterBottom>
                    Live Transcripts
                </Typography>
            )}

            <List sx={{ width: "100%" }}>
                <ListItemText primary="Available Transcripts" sx={{ ml: 1, display: "block" }} />
                {streamers.map((streamer) => (
                    <ListItem key={streamer.value} disablePadding>
                        <ListItemButton
                            onClick={() => handleStreamerChange(streamer.value)}
                            sx={{ overflow: "hidden" }}
                        >
                            <ListItemIcon>{streamer.icon}</ListItemIcon>
                            <ListItemText primary={streamer.name} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
