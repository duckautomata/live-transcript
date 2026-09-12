import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Skeleton,
    Tooltip,
    Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { authApi, errorMessage } from "../../logic/api";
import { clearStoredDrafts } from "../../logic/eventDraft";
import { ago } from "../../logic/notifications";
import { useAppStore } from "../../store/store";

/**
 * Everyone signed in to the account, on every device. An account can be
 * shared by a whole mod team; this is how they see who is signed in and
 * end a session they do not recognise.
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function SessionsDialog({ open, onClose }) {
    const signOut = useAppStore((state) => state.signOut);
    const showToast = useAppStore((state) => state.showToast);
    const [sessions, setSessions] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        setError("");
        authApi
            .sessions()
            .then((res) => {
                if (!cancelled) setSessions((res && res.sessions) || []);
            })
            .catch((err) => {
                if (!cancelled) setError(errorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [open, reloadKey]);

    const revoke = async (session) => {
        setBusy(true);
        try {
            await authApi.revokeSession(session.id);
            if (session.current) {
                clearStoredDrafts();
                signOut();
                showToast("Signed out", "info");
                onClose();
                return;
            }
            showToast(`Signed out ${session.label}`, "success");
            setReloadKey((k) => k + 1);
        } catch (err) {
            showToast(errorMessage(err), "error");
        } finally {
            setBusy(false);
        }
    };

    const revokeOthers = async () => {
        setBusy(true);
        try {
            const res = await authApi.logoutAll();
            const n = (res && res.sessionsEnded) || 0;
            showToast(n ? `Signed out ${n} other session${n === 1 ? "" : "s"}` : "No other sessions", "success");
            setReloadKey((k) => k + 1);
        } catch (err) {
            showToast(errorMessage(err), "error");
        } finally {
            setBusy(false);
        }
    };

    const others = (sessions || []).filter((s) => !s.current).length;

    return (
        <Dialog
            open={open}
            onClose={busy ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="sessions-dialog-title"
        >
            <DialogTitle id="sessions-dialog-title">Signed-in sessions</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Everyone signed in to this account, on every device. If your mod team shares the account, this is
                    all of them. Sign out any session you do not recognise; the account and its events are not affected.
                    Where each session signed in from is not shown, so nobody on a shared account can see where the
                    others are.
                </DialogContentText>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {!sessions && !error && (
                    <Box>
                        <Skeleton />
                        <Skeleton />
                    </Box>
                )}
                {sessions && (
                    <List dense disablePadding data-testid="sessions-list">
                        {sessions.map((s) => (
                            <ListItem
                                key={s.id}
                                divider
                                secondaryAction={
                                    <Tooltip title={s.current ? "Sign out" : "Sign out this session"}>
                                        <span>
                                            <IconButton
                                                edge="end"
                                                aria-label={s.current ? "Sign out" : `Sign out ${s.label}`}
                                                onClick={() => revoke(s)}
                                                disabled={busy}
                                                data-testid={`session-revoke-${s.id}`}
                                            >
                                                <LogoutIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                            <Typography component="span" sx={{ fontWeight: 600 }}>
                                                {s.label}
                                            </Typography>
                                            {s.current && <Chip size="small" color="primary" label="This browser" />}
                                        </Box>
                                    }
                                    secondary={`signed in ${ago(s.createdAt)} · last active ${ago(s.lastSeenAt)}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={revokeOthers}
                    disabled={busy || !others}
                    color="warning"
                    data-testid="sessions-sign-out-others"
                >
                    Sign out other sessions
                </Button>
                <Button onClick={onClose} disabled={busy}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
