import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    ListItemButton,
    ListItemIcon,
    useMediaQuery,
    Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyIcons } from "../config";

export default function Home() {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:768px)");

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
                {keyIcons().map((streamer) => (
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

            <Typography paddingTop={10}>Looking for the transcript of a past stream instead?</Typography>
            <Button href="/archived-transcript" variant="outlined">
                Go to Archived-Transcript
            </Button>
        </Box>
    );
}
