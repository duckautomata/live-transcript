import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

/**
 * A yes/no question before something that cannot be undone, with an
 * optional third choice.
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {React.ReactNode} props.message
 * @param {string} [props.okLabel]
 * @param {boolean} [props.danger]
 * @param {boolean} [props.busy]
 * @param {string} [props.cancelLabel]
 * @param {string} [props.secondaryLabel] - a third button between Cancel and OK
 * @param {"error" | "primary" | "inherit"} [props.secondaryColor]
 * @param {() => void} [props.onSecondary]
 * @param {() => void} props.onCancel
 * @param {() => void} props.onConfirm
 */
export default function ConfirmDialog({
    open,
    title,
    message,
    okLabel = "Confirm",
    danger = true,
    busy,
    cancelLabel = "Cancel",
    secondaryLabel,
    secondaryColor = "inherit",
    onSecondary,
    onCancel,
    onConfirm,
}) {
    return (
        <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ whiteSpace: "pre-line" }}>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={busy}>
                    {cancelLabel}
                </Button>
                {secondaryLabel && (
                    <Button
                        onClick={onSecondary}
                        disabled={busy}
                        color={secondaryColor}
                        data-testid="confirm-secondary"
                    >
                        {secondaryLabel}
                    </Button>
                )}
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={danger ? "error" : "primary"}
                    disabled={busy}
                    data-testid="confirm-ok"
                >
                    {okLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
