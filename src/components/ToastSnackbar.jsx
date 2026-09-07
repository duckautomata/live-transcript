import { Alert, Snackbar } from "@mui/material";
import { useAppStore } from "../store/store";

/**
 * Renders the global toast from the store (see `showToast`). Mounted once in App.
 */
export default function ToastSnackbar() {
    const toast = useAppStore((state) => state.toast);
    const hideToast = useAppStore((state) => state.hideToast);

    const handleClose = (_event, reason) => {
        if (reason === "clickaway") return;
        hideToast();
    };

    return (
        <Snackbar
            key={toast?.key}
            open={Boolean(toast)}
            autoHideDuration={2500}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert
                onClose={handleClose}
                severity={toast?.severity || "success"}
                variant="filled"
                data-testid="toast"
                sx={{ width: "100%" }}
            >
                {toast?.message}
            </Alert>
        </Snackbar>
    );
}
