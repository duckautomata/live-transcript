import { Alert, Box } from "@mui/material";

export default function ConnectionBanner() {
    return (
        <Box
            sx={{
                position: "fixed",
                top: 16,
                right: 16,
                zIndex: 9999,
                maxWidth: 300,
            }}
        >
            <Alert
                severity="warning"
                variant="filled"
                sx={{
                    py: 0,
                    px: 2,
                    fontSize: "0.875rem",
                    boxShadow: 3,
                }}
            >
                Lost connection. Reconnecting
                <span className="loading-dots" />
            </Alert>
        </Box>
    );
}
