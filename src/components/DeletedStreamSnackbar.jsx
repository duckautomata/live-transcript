import { Snackbar, Alert } from "@mui/material";
import { useAppStore } from "../store/store";

/**
 * Toast shown when the server broadcasts a `deletedStream` event,
 * informing the user that an admin removed a stream from this channel.
 */
export default function DeletedStreamSnackbar() {
    const notice = useAppStore((state) => state.deletedStreamNotice);
    const setDeletedStreamNotice = useAppStore((state) => state.setDeletedStreamNotice);

    const handleClose = (_event, reason) => {
        if (reason === "clickaway") return;
        setDeletedStreamNotice(null);
    };

    return (
        <Snackbar
            open={!!notice}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert
                severity="info"
                variant="filled"
                onClose={() => setDeletedStreamNotice(null)}
                data-testid="deleted-stream-toast"
                sx={{ width: "100%" }}
            >
                Stream &quot;{notice}&quot; was deleted by an admin.
            </Alert>
        </Snackbar>
    );
}
