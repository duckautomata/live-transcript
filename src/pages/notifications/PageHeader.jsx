import { Box, Button, IconButton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LoginIcon from "@mui/icons-material/Login";
import AccountMenu from "./AccountMenu";

/**
 * The page title, one line saying what the page is for, and the account
 * control.
 * @param {object} props
 * @param {string} props.channelName
 * @param {boolean} props.signedIn
 * @param {() => void} props.onSignIn
 * @param {() => void} props.onRefresh
 */
export default function PageHeader({ channelName, signedIn, onSignIn, onRefresh }) {
    const isMobile = useMediaQuery("(max-width:768px)");
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
                flexWrap: "wrap",
                mb: 2,
                pl: isMobile ? 6 : 0,
            }}
        >
            <Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }} data-testid="notifications-title">
                    Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Post to your own Discord when {channelName} goes live, schedules a stream, or uploads.
                </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title="Refresh">
                    <IconButton onClick={onRefresh} aria-label="Refresh" size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                {signedIn ? (
                    <AccountMenu />
                ) : (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LoginIcon />}
                        onClick={onSignIn}
                        data-testid="sign-in-button"
                    >
                        Sign in
                    </Button>
                )}
            </Box>
        </Box>
    );
}
