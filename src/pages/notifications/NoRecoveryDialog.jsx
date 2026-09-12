import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
} from "@mui/material";

/**
 * The last word before a password is set. Accounts have no email or recovery
 * path: whoever loses the username or password has lost the account and
 * every event in it. The confirm button stays off until the checkbox says
 * the password is saved.
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {React.ReactNode} props.message
 * @param {string} props.okLabel
 * @param {boolean} [props.busy]
 * @param {() => void} props.onCancel
 * @param {() => void} props.onConfirm
 */
export default function NoRecoveryDialog({ open, title, message, okLabel, busy, onCancel, onConfirm }) {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (open) setSaved(false);
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={busy ? undefined : onCancel}
            maxWidth="xs"
            fullWidth
            aria-labelledby="no-recovery-title"
        >
            <DialogTitle id="no-recovery-title">{title}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Alert severity="warning" data-testid="no-recovery-warning">
                    There is no way to recover an account. No email, no reset link, nobody who can look it up. If the
                    username or password is lost, the account and every notification event in it are gone for good.
                </Alert>
                <DialogContentText>{message}</DialogContentText>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={saved}
                            onChange={(e) => setSaved(e.target.checked)}
                            disabled={busy}
                            slotProps={{ input: { "data-testid": "no-recovery-check" } }}
                        />
                    }
                    label="I have saved the username and password somewhere safe"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={busy}>
                    Go back
                </Button>
                <Button onClick={onConfirm} variant="contained" disabled={busy || !saved} data-testid="no-recovery-ok">
                    {okLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
