import { useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import { errorMessage, notificationsApi } from "../../logic/api";
import { TRIGGER_SHORT, WEBHOOK_RE, maskWebhook } from "../../logic/notifications";
import { useAppStore } from "../../store/store";

/**
 * Post the draft's rendering to one webhook with every ping suppressed. The
 * one path from the editor to a real Discord channel, so it says what will
 * happen first. Mounted only while open, with the draft as it was then.
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.channel
 * @param {object} props.draft
 * @param {string} props.trigger
 * @param {object} [props.sample] - the last preview's sample, for the offline note
 */
export default function TestSendDialog({ open, onClose, channel, draft, trigger, sample }) {
    const showToast = useAppStore((state) => state.showToast);
    const hooks = (draft.webhooks || []).filter((h) => WEBHOOK_RE.test((h.url || "").trim()));
    const [choice, setChoice] = useState(hooks.length ? "0" : "custom");
    const [customUrl, setCustomUrl] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const offline = sample && sample.source === "recent" && sample.platform === "twitch" && sample.ended;

    const send = async () => {
        const hook = choice === "custom" ? { name: "", url: customUrl.trim() } : hooks[Number(choice)];
        if (!hook || !WEBHOOK_RE.test(hook.url)) {
            setError("Enter a Discord webhook URL to send the test to (https://discord.com/api/webhooks/…).");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const res = await notificationsApi.test(channel, draft, trigger, hook);
            if (res && res.ok) {
                showToast(`Test sent to ${res.webhook} with pings suppressed`, "success");
                onClose();
            } else {
                setError(`The test could not be delivered: ${(res && res.error) || "unknown error"}`);
            }
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Send a test?</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <DialogContentText>
                    Posts a visible message to the webhook below, rendered for the{" "}
                    <strong>{TRIGGER_SHORT[trigger] || trigger}</strong> trigger from the same detection as the preview.
                    Every ping is suppressed: nobody is notified.
                </DialogContentText>
                {offline && (
                    <DialogContentText>
                        That stream is offline, so the test goes out without the example
                        {sample.exampleTitle ? " title and" : ""} image. A real announcement carries the live frame
                        {sample.exampleTitle ? " and the title" : ""}.
                    </DialogContentText>
                )}
                <FormControl fullWidth size="small">
                    <InputLabel id="test-webhook-label">Send it to</InputLabel>
                    <Select
                        labelId="test-webhook-label"
                        label="Send it to"
                        value={choice}
                        onChange={(e) => setChoice(e.target.value)}
                        data-testid="test-webhook-select"
                    >
                        {hooks.map((h, i) => (
                            <MenuItem key={i} value={String(i)}>
                                {h.name ? `${h.name} (${maskWebhook(h.url)})` : maskWebhook(h.url)}
                            </MenuItem>
                        ))}
                        <MenuItem value="custom">Another webhook…</MenuItem>
                    </Select>
                </FormControl>
                {choice === "custom" && (
                    <TextField
                        label="Webhook URL"
                        placeholder="https://discord.com/api/webhooks/…"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        fullWidth
                        size="small"
                        autoFocus
                        slotProps={{ htmlInput: { "data-testid": "test-webhook-custom", autoComplete: "off" } }}
                    />
                )}
                {error && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button onClick={send} variant="contained" disabled={busy} data-testid="test-send">
                    Send test
                </Button>
            </DialogActions>
        </Dialog>
    );
}
