import { useState } from "react";
import { Box, Button, IconButton, InputAdornment, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Section from "./Section";
import { useActions, useDraft, useDraftShallow, useEditor } from "./editorContext";
import { WEBHOOK_RE } from "../../../logic/notifications";

const HELP = (
    <>
        In Discord, open the channel&apos;s settings → <strong>Integrations</strong> → <strong>Webhooks</strong> →{" "}
        <strong>New Webhook</strong> → <strong>Copy Webhook URL</strong>, and paste it here.
        <br />
        <br />
        Anyone holding a webhook URL can post to that channel, so it is stored for your account alone and shown in full
        only on this page. Everywhere else it appears by name.
    </>
);

/**
 * Step 2: the Discord webhooks the event posts to. One row each: a name
 * saying where it goes, and the URL, which is only ever visible here.
 */
export default function WebhooksSection() {
    const { vocab } = useEditor();
    const rowIds = useDraftShallow((s) => s.draft.webhooks.map((h) => h.rowId));
    const error = useDraft((s) => s.problems.byPath.webhooks || "");
    const actions = useActions();
    const atLimit = rowIds.length >= vocab.limits.webhooks;
    return (
        <Section
            number={2}
            title="Where should it post?"
            hint="One row per Discord webhook. Name it after the channel it posts to."
            help={HELP}
            error={error}
            field="webhooks"
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }} data-testid="editor-webhooks">
                {rowIds.map((id, i) => (
                    <WebhookRow key={id} index={i} />
                ))}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => actions().addWebhook()}
                        disabled={atLimit}
                        data-testid="editor-webhook-add"
                    >
                        Add webhook
                    </Button>
                    {rowIds.length > 1 && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {rowIds.length} of {vocab.limits.webhooks}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Section>
    );
}

function WebhookRow({ index }) {
    const hook = useDraft((s) => s.draft.webhooks[index]);
    const problem = useDraft((s) => s.problems.byPath[`webhooks.${index}.url`] || "");
    const isNew = useDraft((s) => s.isNew);
    const actions = useActions();
    const [touched, setTouched] = useState(false);
    if (!hook) return null;
    const url = (hook.url || "").trim();
    const valid = url !== "" && WEBHOOK_RE.test(url);
    const showBad = (touched || Boolean(problem)) && url !== "" && !valid;
    const helper = problem && url === "" ? problem : showBad ? "Not a Discord webhook URL" : undefined;

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField
                label="Name"
                value={hook.name || ""}
                onChange={(e) => actions().setWebhook(index, { name: e.target.value })}
                onPaste={(e) => {
                    // A webhook URL pasted into the name box belongs in the URL box.
                    const text = (e.clipboardData && e.clipboardData.getData("text")) || "";
                    if (WEBHOOK_RE.test(text.trim())) {
                        e.preventDefault();
                        actions().setWebhook(index, { url: text.trim() });
                    }
                }}
                placeholder="#announcements"
                variant="outlined"
                size="small"
                sx={{ width: { xs: "100%", sm: 190 }, flexShrink: 0 }}
                slotProps={{
                    htmlInput: {
                        maxLength: 64,
                        "aria-label": `Webhook ${index + 1} name`,
                        "data-testid": `editor-webhook-name-${index}`,
                    },
                }}
            />
            <TextField
                label="Webhook URL"
                value={hook.url || ""}
                onChange={(e) => actions().setWebhook(index, { url: e.target.value })}
                onBlur={() => setTouched(true)}
                placeholder="https://discord.com/api/webhooks/…"
                variant="outlined"
                size="small"
                fullWidth
                autoFocus={isNew && index === 0 && !hook.url}
                error={Boolean(helper)}
                helperText={helper}
                slotProps={{
                    htmlInput: {
                        "aria-label": `Webhook ${index + 1} URL`,
                        "data-testid": `editor-webhook-url-${index}`,
                        "data-field": `webhooks.${index}.url`,
                        autoComplete: "off",
                        spellCheck: false,
                        style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13 },
                    },
                    input: valid
                        ? {
                              endAdornment: (
                                  <InputAdornment position="end">
                                      <CheckCircleIcon color="success" sx={{ fontSize: 18 }} aria-label="Valid" />
                                  </InputAdornment>
                              ),
                          }
                        : undefined,
                }}
            />
            <Tooltip title="Remove webhook">
                <IconButton
                    aria-label={`Remove webhook ${index + 1}`}
                    onClick={() => {
                        actions().removeWebhook(index);
                        // Land on the row that takes this one's place, or the one above.
                        requestAnimationFrame(() => {
                            const rows = document.querySelectorAll('[data-testid^="editor-webhook-url-"]');
                            const next = rows[Math.min(index, rows.length - 1)];
                            if (next) next.focus();
                        });
                    }}
                    data-testid={`editor-webhook-remove-${index}`}
                    sx={{ mt: 0.25 }}
                >
                    <DeleteOutlineIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
}
