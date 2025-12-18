import { Engineering } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * A fallback component shown when the application is in maintenance mode.
 */
export default function Maintenance() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                height: "50vh",
            }}
        >
            <Engineering color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                Live Transcript is currently down for maintenance.
            </Typography>
            <Typography color="text.secondary">{window.maintenanceText1}</Typography>
            <Typography color="text.secondary">{window.maintenanceText2}</Typography>
            <br />
            <Typography color="text.secondary">
                If you want to use the tag fixer, you can find it here:{" "}
                <Link to="/tagFixer">Click to go to tag fixer</Link>
            </Typography>
        </Box>
    );
}
