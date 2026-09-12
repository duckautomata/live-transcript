import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { authApi, errorMessage } from "../../logic/api";
import { copyToClipboard } from "../../logic/clipboard";
import { GENERATED_PASSWORD_LENGTH, generatePassword } from "../../logic/password";
import { useAppStore } from "../../store/store";
import NoRecoveryDialog from "./NoRecoveryDialog";

/**
 * Sign in or create an account. On success the session goes into the store
 * and the dialog closes.
 * @param {object} props
 * @param {boolean} props.open
 * @param {"signin" | "register"} [props.initialMode] - which tab to open on
 * @param {() => void} props.onClose
 */
export default function AccountDialog({ open, onClose, initialMode = "signin" }) {
    const setAccountSession = useAppStore((state) => state.setAccountSession);
    const showToast = useAppStore((state) => state.showToast);
    const [mode, setMode] = useState("signin");
    const [info, setInfo] = useState(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    // "copied" or "shown" once a password was generated, for the note under the fields.
    const [generated, setGenerated] = useState("");
    // The no-recovery confirmation shown between "Create account" and the request.
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!open) return;
        setMode(initialMode);
        setError("");
        setPassword("");
        setConfirm("");
        setGenerated("");
        setShowPassword(false);
        setConfirming(false);
        let cancelled = false;
        authApi
            .info()
            .then((data) => {
                if (!cancelled) setInfo(data);
            })
            .catch(() => {
                if (!cancelled) setInfo({ registrationOpen: true, minPasswordLength: 8, maxPasswordLength: 128 });
            });
        return () => {
            cancelled = true;
        };
    }, [open, initialMode]);

    const registering = mode === "register";
    const minPassword = (info && info.minPasswordLength) || 8;

    /**
     * Fill both password fields with a generated one, show it, and put it on
     * the clipboard: a generated password is for a password manager, not a
     * memory, so it has to leave this form somehow before it is submitted.
     */
    const generate = async () => {
        let pw;
        try {
            pw = generatePassword();
        } catch (err) {
            setError(errorMessage(err));
            return;
        }
        setPassword(pw);
        setConfirm(pw);
        setShowPassword(true);
        setError("");
        setGenerated((await copyToClipboard(pw)) ? "copied" : "shown");
    };

    /**
     * Sign in straight away; creating an account first asks for the
     * no-recovery confirmation, then send() does the request.
     */
    const submit = (e) => {
        e.preventDefault();
        setError("");
        const user = username.trim();
        if (!user || !password) {
            setError("Enter a username and a password.");
            return;
        }
        if (!registering) {
            send();
            return;
        }
        if (password.length < minPassword) {
            setError(`Use at least ${minPassword} characters. A few words you will remember work well.`);
            return;
        }
        if (password !== confirm) {
            setError("The two passwords do not match.");
            return;
        }
        setConfirming(true);
    };

    const send = async () => {
        const user = username.trim();
        setBusy(true);
        try {
            const session = registering ? await authApi.register(user, password) : await authApi.login(user, password);
            setAccountSession(session.token, {
                username: session.account.username,
                createdAt: session.account.createdAt,
            });
            showToast(
                registering ? `Welcome, ${session.account.username}!` : `Signed in as ${session.account.username}`,
                "success",
            );
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
            onClose={busy ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            aria-labelledby="account-dialog-title"
        >
            <DialogTitle id="account-dialog-title">{registering ? "Create an account" : "Sign in"}</DialogTitle>
            <DialogContent>
                <Tabs
                    value={mode}
                    onChange={(_e, v) => {
                        setMode(v);
                        setError("");
                    }}
                    variant="fullWidth"
                    sx={{ mb: 2 }}
                >
                    <Tab value="signin" label="Sign in" data-testid="account-tab-signin" />
                    <Tab
                        value="register"
                        label="Create account"
                        disabled={info ? !info.registrationOpen : false}
                        data-testid="account-tab-register"
                    />
                </Tabs>
                {info && !info.registrationOpen && registering && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        New accounts are not being accepted right now.
                    </Alert>
                )}
                <Box
                    component="form"
                    id="account-form"
                    onSubmit={submit}
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                        fullWidth
                        variant="outlined"
                        helperText={
                            registering
                                ? "3 to 32 characters: letters, digits, dots, underscores and hyphens."
                                : undefined
                        }
                        slotProps={{ htmlInput: { "data-testid": "account-username", maxLength: 32 } }}
                    />
                    <TextField
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={registering ? "new-password" : "current-password"}
                        required
                        fullWidth
                        variant="outlined"
                        helperText={
                            registering
                                ? `At least ${minPassword} characters. Length beats symbols: a few words you will remember.`
                                : undefined
                        }
                        slotProps={{
                            htmlInput: { "data-testid": "account-password", maxLength: 128 },
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((v) => !v)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    {registering && (
                        <TextField
                            label="Confirm password"
                            type={showPassword ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                            fullWidth
                            variant="outlined"
                            slotProps={{ htmlInput: { "data-testid": "account-confirm", maxLength: 128 } }}
                        />
                    )}
                    {registering && (
                        <Box>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AutoFixHighIcon />}
                                onClick={generate}
                                data-testid="account-generate-password"
                            >
                                Generate a secure password
                            </Button>
                        </Box>
                    )}
                    {registering && generated && (
                        <Alert severity="info" data-testid="account-generated-note">
                            A random {GENERATED_PASSWORD_LENGTH}-character password was filled in
                            {generated === "copied" ? " and copied to your clipboard" : ""}. Save it in a password
                            manager before you continue - it cannot be recovered later.
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" data-testid="account-error">
                            {error}
                        </Alert>
                    )}
                    {registering && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            An account only holds your notification events, and your webhooks are visible to nobody but
                            you. One account can be shared: a whole mod team can sign in with it at the same time, and
                            Sessions in the account menu shows who is signed in.
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="account-form"
                    variant="contained"
                    disabled={busy}
                    data-testid="account-submit"
                >
                    {registering ? "Create account" : "Sign in"}
                </Button>
            </DialogActions>
            <NoRecoveryDialog
                open={confirming}
                title={`Create the account ${username.trim()}?`}
                message="Write the username and password down, or keep them in a password manager, before the account is created."
                okLabel="Create account"
                busy={busy}
                onCancel={() => setConfirming(false)}
                onConfirm={send}
            />
        </Dialog>
    );
}
