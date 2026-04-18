import {
    Typography,
    Box,
    useMediaQuery,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Container,
    Fade,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyIcons } from "../../config";
import { useAppStore } from "../../store/store";

export default function Home() {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:768px)");
    const devMode = useAppStore((state) => state.devMode);
    const setPastStreamViewing = useAppStore((state) => state.setPastStreamViewing);

    const handleStreamerChange = (value) => {
        setPastStreamViewing(null);
        navigate(`/${value}/`);
    };

    return (
        <Container
            maxWidth="lg"
            sx={{
                minHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
            }}
        >
            <Box sx={{ mb: 6, textAlign: "center" }}>
                <Typography
                    variant={isMobile ? "h3" : "h2"}
                    component="h1"
                    data-testid="home-title"
                    sx={{
                        fontWeight: "bold",
                        background: (theme) =>
                            `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.alt})`,
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        textFillColor: "transparent",
                        WebkitTextFillColor: "transparent",
                        mb: 2,
                    }}
                >
                    Live Transcripts
                </Typography>
                <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 600, mx: "auto" }}>
                    Select a streamer to view real-time transcripts.
                </Typography>
            </Box>

            <Grid container spacing={4} sx={{ width: "100%", justifyContent: "center", alignItems: "stretch" }}>
                {keyIcons(120, devMode).map((streamer, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={streamer.value} sx={{ display: "flex" }}>
                        <Fade in={true} timeout={500 + index * 200}>
                            <Card
                                sx={{
                                    width: "100%",
                                    borderRadius: 4,
                                    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                                    "&:hover": {
                                        transform: "translateY(-8px)",
                                        boxShadow: (theme) => theme.shadows[10],
                                    },
                                    background: (theme) => theme.palette.background.paper,
                                }}
                                elevation={4}
                            >
                                <CardActionArea
                                    onClick={() => handleStreamerChange(streamer.value)}
                                    data-testid={streamer.testId}
                                    sx={{
                                        height: "100%",
                                        p: 3,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Box sx={{ mb: 3 }}>{streamer.icon}</Box>
                                    <CardContent sx={{ p: 0, textAlign: "center" }}>
                                        <Typography gutterBottom variant="h4" component="div" fontWeight="medium">
                                            {streamer.name}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Fade>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 8, textAlign: "center" }}>
                <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                    Looking for past streams?
                </Typography>
                <Button
                    href="/archived-transcript/"
                    variant="outlined"
                    size="large"
                    data-testid="archive-btn"
                    sx={{
                        mt: 1,
                        borderRadius: 2,
                        px: 4,
                        textTransform: "none",
                        fontSize: "1.1rem",
                    }}
                >
                    Browse Archived Transcripts
                </Button>
            </Box>
        </Container>
    );
}
