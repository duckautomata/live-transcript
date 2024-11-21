import { useContext } from "react";
import { AppBar, Toolbar, ButtonGroup, Button, Container } from "@mui/material";
import { SettingContext } from "../providers/SettingProvider";

export default function Footer() {
    const { page, setPage } = useContext(SettingContext);

    return (
        <AppBar position="fixed" sx={{ top: "auto", bottom: 0 }}>
            <Toolbar>
                <Container maxWidth="sm" sx={{ textAlign: "center" }}>
                    <ButtonGroup variant="contained">
                        <Button
                            color={page === "wordCount" ? "info" : "background"}
                            onClick={() => setPage("wordCount")}
                        >
                            Word Count
                        </Button>
                        <Button
                            color={page === "transcript" ? "info" : "background"}
                            onClick={() => setPage("transcript")}
                        >
                            Transcript
                        </Button>
                    </ButtonGroup>
                </Container>
            </Toolbar>
        </AppBar>
    );
}
