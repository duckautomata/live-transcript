import { useState } from "react";
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
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import KeyIcon from "@mui/icons-material/Key";
import LogoutIcon from "@mui/icons-material/Logout";
import DevicesIcon from "@mui/icons-material/Devices";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { authApi, errorMessage } from "../../logic/api";
import { copyToClipboard } from "../../logic/clipboard";
import { GENERATED_PASSWORD_LENGTH, generatePassword } from "../../logic/password";
import { useAppStore } from "../../store/store";
import { clearStoredDrafts } from "../../logic/eventDraft";
import SessionsDialog from "./SessionsDialog";
import NoRecoveryDialog from "./NoRecoveryDialog";

/**
 * The signed-in account's chip and its menu: sessions (everyone signed in,
 * for a shared account), change password, delete account, sign out.
 */
export default function AccountMenu() {
    const user = useAppStore((state) => state.accountUser);
    const signOut = useAppStore((state) => state.signOut);
    const showToast = useAppStore((state) => state.showToast);
    const [anchor, setAnchor] = useState(null);
    const [dialog, setDialog] = useState(null); // "sessions" | "password" | "delete" | null

    const close = () => setAnchor(null);

    const doSignOut = async () => {
        close();
        try {
            await authApi.logout();
        } catch {
            // The token is dropped either way; a dead session is already signed out.
        }
        clearStoredDrafts();
        signOut();
        showToast("Signed out", "info");
    };

    if (!user) return null;
    return (
        <>
            <Chip
                icon={<AccountCircle />}
                label={user.username}
                onClick={(e) => setAnchor(e.currentTarget)}
                variant="outlined"
                aria-haspopup="menu"
                aria-controls={anchor ? "account-menu" : undefined}
                data-testid="account-chip"
            />
            <Menu id="account-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
                <MenuItem
                    onClick={() => {
                        close();
                        setDialog("password");
                    }}
                    data-testid="account-change-password"
                >
                    <ListItemIcon>
                        <KeyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Change password…</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        close();
                        setDialog("sessions");
                    }}
                    data-testid="account-sessions"
                >
                    <ListItemIcon>
                        <DevicesIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sessions…</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        close();
                        setDialog("delete");
                    }}
                    data-testid="account-delete"
                >
                    <ListItemIcon>
                        <DeleteForeverIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete account…</ListItemText>
                </MenuItem>
                <MenuItem onClick={doSignOut} data-testid="account-sign-out">
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sign out</ListItemText>
                </MenuItem>
            </Menu>
            <SessionsDialog open={dialog === "sessions"} onClose={() => setDialog(null)} />
            <ChangePasswordDialog open={dialog === "password"} onClose={() => setDialog(null)} />
            <DeleteAccountDialog open={dialog === "delete"} onClose={() => setDialog(null)} />
        </>
    );
}

function ChangePasswordDialog({ open, onClose }) {
    const showToast = useAppStore((state) => state.showToast);
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    // "copied" or "shown" once a password was generated; the new password is shown then.
    const [generated, setGenerated] = useState("");
    // The no-recovery confirmation shown between "Change password" and the request.
    const [confirming, setConfirming] = useState(false);

    const reset = () => {
        setCurrent("");
        setNext("");
        setConfirm("");
        setError("");
        setGenerated("");
        setConfirming(false);
    };
    const generate = async () => {
        let pw;
        try {
            pw = generatePassword();
        } catch (err) {
            setError(errorMessage(err));
            return;
        }
        setNext(pw);
        setConfirm(pw);
        setError("");
        setGenerated((await copyToClipboard(pw)) ? "copied" : "shown");
    };
    const submit = (e) => {
        e.preventDefault();
        if (next.length < 8) {
            setError("Use at least 8 characters.");
            return;
        }
        if (next !== confirm) {
            setError("The two new passwords do not match.");
            return;
        }
        setError("");
        setConfirming(true);
    };

    const send = async () => {
        setBusy(true);
        setError("");
        try {
            const res = await authApi.changePassword(current, next);
            const ended = res && res.sessionsEnded;
            showToast(
                ended
                    ? `Password changed. ${ended} other session${ended === 1 ? " was" : "s were"} signed out.`
                    : "Password changed",
                "success",
            );
            reset();
            onClose();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
            setConfirming(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={
                busy
                    ? undefined
                    : () => {
                          reset();
                          onClose();
                      }
            }
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle>Change password</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Every other browser you are signed in on will be signed out.
                </DialogContentText>
                <form
                    id="password-form"
                    onSubmit={submit}
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                    <TextField
                        label="Current password"
                        type="password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        autoComplete="current-password"
                        required
                        variant="outlined"
                        autoFocus
                    />
                    <TextField
                        label="New password"
                        type={generated ? "text" : "password"}
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        autoComplete="new-password"
                        required
                        variant="outlined"
                        helperText="At least 8 characters."
                    />
                    <TextField
                        label="Confirm new password"
                        type={generated ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                        variant="outlined"
                    />
                    <Box>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AutoFixHighIcon />}
                            onClick={generate}
                            data-testid="password-generate"
                        >
                            Generate a secure password
                        </Button>
                    </Box>
                    {generated && (
                        <Alert severity="info">
                            A random {GENERATED_PASSWORD_LENGTH}-character password was filled in
                            {generated === "copied" ? " and copied to your clipboard" : ""}. Save it in a password
                            manager before you continue - it cannot be recovered later.
                        </Alert>
                    )}
                    {error && <Alert severity="error">{error}</Alert>}
                </form>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        reset();
                        onClose();
                    }}
                    disabled={busy}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="password-form"
                    variant="contained"
                    disabled={busy}
                    data-testid="password-submit"
                >
                    Change password
                </Button>
            </DialogActions>
            <NoRecoveryDialog
                open={confirming}
                title="Change the password?"
                message="The old password stops working the moment the new one is set. Make sure the new one is saved before you continue."
                okLabel="Change password"
                busy={busy}
                onCancel={() => setConfirming(false)}
                onConfirm={send}
            />
        </Dialog>
    );
}

function DeleteAccountDialog({ open, onClose }) {
    const signOut = useAppStore((state) => state.signOut);
    const showToast = useAppStore((state) => state.showToast);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            await authApi.deleteAccount(password);
            clearStoredDrafts();
            signOut();
            showToast("Your account and its notification events were deleted", "info");
            setPassword("");
            onClose();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Every notification event you created, on every channel, stops posting and is removed along with your
                    delivery history and sessions. The webhooks themselves are not touched in Discord. This cannot be
                    undone.
                </DialogContentText>
                <form
                    id="delete-account-form"
                    onSubmit={submit}
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                    <TextField
                        label="Your password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        variant="outlined"
                        autoFocus
                    />
                    {error && <Alert severity="error">{error}</Alert>}
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={busy}>
                    Keep my account
                </Button>
                <Button
                    type="submit"
                    form="delete-account-form"
                    variant="contained"
                    color="error"
                    disabled={busy || !password}
                    data-testid="delete-account-submit"
                >
                    Delete account
                </Button>
            </DialogActions>
        </Dialog>
    );
}
