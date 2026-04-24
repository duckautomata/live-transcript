import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export const ConfirmDialog = ({ dialogConfig, setDialogConfig }) => (
    <Dialog open={dialogConfig.open} onClose={() => setDialogConfig((prev) => ({ ...prev, open: false }))}>
        <DialogTitle>{dialogConfig.title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{dialogConfig.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
            {dialogConfig.onConfirm && (
                <Button onClick={() => setDialogConfig((prev) => ({ ...prev, open: false }))} color="primary">
                    {dialogConfig.cancelLabel}
                </Button>
            )}
            <Button
                onClick={() => {
                    if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                    setDialogConfig((prev) => ({ ...prev, open: false }));
                }}
                color="secondary"
                autoFocus
            >
                {dialogConfig.confirmLabel || "OK"}
            </Button>
        </DialogActions>
    </Dialog>
);
