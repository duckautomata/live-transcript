import { useState } from "react";
import { Box, Button, Chip, Popover, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import { insertAtCaret } from "./paths";
import { useEditor } from "./editorContext";

/**
 * The row of placeholder chips under a template field. Each chip inserts
 * its placeholder into that field at the caret, so there is never a
 * question of which field a click lands in.
 * @param {object} props
 * @param {string} props.path - the draft field the bar belongs to
 * @param {{current: any}} props.inputRef
 * @param {boolean} [props.mentions] - offer the "@ Mention" chip (message only: pings live there)
 */
export default function InsertBar({ path, inputRef, mentions }) {
    const { store, vocab } = useEditor();
    const insert = (text) => insertAtCaret(store, path, inputRef, text);
    return (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", mt: 1 }}>
            {mentions && <MentionChip onInsert={insert} />}
            {vocab.placeholders.map((p) => (
                <Chip
                    key={p.name}
                    size="small"
                    variant="outlined"
                    label={p.name}
                    title={p.description}
                    onClick={() => insert(p.name)}
                    sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12 }}
                />
            ))}
        </Box>
    );
}

/** The three things a Discord message can point at, with Discord's syntax for each. */
const MENTIONS = {
    role: {
        label: "Role",
        field: "Role ID",
        syntax: (id) => `<@&${id}> `,
        how: (
            <>
                Server Settings → Roles → ⋯ next to the role → <strong>Copy Role ID</strong>. Everyone in the role gets
                pinged.
            </>
        ),
    },
    user: {
        label: "User",
        field: "User ID",
        syntax: (id) => `<@${id}> `,
        how: (
            <>
                Right-click the person → <strong>Copy User ID</strong>. Only that person gets pinged.
            </>
        ),
    },
    channel: {
        label: "Channel",
        field: "Channel ID",
        syntax: (id) => `<#${id}> `,
        how: (
            <>
                Right-click the channel → <strong>Copy Channel ID</strong>. Inserts a link to the channel; it pings
                nobody.
            </>
        ),
    },
};

/** "@ Mention": asks which kind and which id, and inserts Discord's syntax for it. */
function MentionChip({ onInsert }) {
    const [anchor, setAnchor] = useState(null);
    const [kind, setKind] = useState("role");
    const [id, setId] = useState("");
    const ok = /^\d{5,30}$/.test(id);
    const close = () => setAnchor(null);
    const insert = () => {
        onInsert(MENTIONS[kind].syntax(id));
        setId("");
        close();
    };
    const m = MENTIONS[kind];
    return (
        <>
            <Chip
                size="small"
                color="primary"
                icon={<AlternateEmailIcon />}
                label="Mention"
                onClick={(e) => setAnchor(e.currentTarget)}
                data-testid="editor-mention"
                sx={{ fontWeight: 600 }}
            />
            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={close}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: { sx: { p: 2, maxWidth: 380 } } }}
            >
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={kind}
                    onChange={(_e, v) => {
                        if (v) setKind(v);
                    }}
                    aria-label="What to mention"
                    sx={{ mb: 1.5 }}
                >
                    {Object.entries(MENTIONS).map(([key, entry]) => (
                        <ToggleButton key={key} value={key} data-testid={`editor-mention-${key}`} sx={{ px: 1.5 }}>
                            {entry.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <TextField
                        label={m.field}
                        value={id}
                        onChange={(e) => setId(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && ok) {
                                e.preventDefault();
                                insert();
                            }
                        }}
                        placeholder="a long number"
                        helperText="Numbers only, 5 to 30 digits"
                        variant="outlined"
                        size="small"
                        autoFocus
                        slotProps={{ htmlInput: { inputMode: "numeric", "data-testid": "editor-mention-id" } }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        disabled={!ok}
                        onClick={insert}
                        data-testid="editor-mention-insert"
                        sx={{ mt: 0.25, flexShrink: 0 }}
                    >
                        Insert
                    </Button>
                </Box>
                <Typography variant="caption" component="div" sx={{ color: "text.secondary", mt: 1.5 }}>
                    {m.how}
                </Typography>
                <Typography variant="caption" component="div" sx={{ color: "text.secondary", mt: 0.5 }}>
                    Copying ids needs <strong>Developer Mode</strong>: Discord → User Settings → Advanced. Test sends
                    never ping anyone.
                </Typography>
            </Popover>
        </>
    );
}
