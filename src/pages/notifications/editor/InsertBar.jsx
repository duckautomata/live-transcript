import { useState } from "react";
import { Box, Button, Chip, Popover, TextField, Typography } from "@mui/material";
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
 * @param {boolean} [props.rolePing] - offer the "@ Role ping" chip (message only)
 */
export default function InsertBar({ path, inputRef, rolePing }) {
    const { store, vocab } = useEditor();
    const insert = (text) => insertAtCaret(store, path, inputRef, text);
    return (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", mt: 1 }}>
            {rolePing && <RolePingChip onInsert={insert} />}
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

/** "@ Role ping": asks for the role id and inserts the mention. */
function RolePingChip({ onInsert }) {
    const [anchor, setAnchor] = useState(null);
    const [roleId, setRoleId] = useState("");
    const ok = /^\d{5,30}$/.test(roleId);
    const close = () => setAnchor(null);
    const insert = () => {
        onInsert(`<@&${roleId}> `);
        setRoleId("");
        close();
    };
    return (
        <>
            <Chip
                size="small"
                color="primary"
                icon={<AlternateEmailIcon />}
                label="Role ping"
                onClick={(e) => setAnchor(e.currentTarget)}
                data-testid="editor-role-ping"
                sx={{ fontWeight: 600 }}
            />
            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={close}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: { sx: { p: 2, maxWidth: 360 } } }}
            >
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <TextField
                        label="Role ID"
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value.replace(/\D/g, ""))}
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
                        slotProps={{ htmlInput: { inputMode: "numeric", "data-testid": "editor-role-id" } }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        disabled={!ok}
                        onClick={insert}
                        data-testid="editor-insert-role"
                        sx={{ mt: 0.25, flexShrink: 0 }}
                    >
                        Insert
                    </Button>
                </Box>
                <Typography variant="caption" component="div" sx={{ color: "text.secondary", mt: 1.5 }}>
                    Discord → User Settings → Advanced → turn on <strong>Developer Mode</strong>. Then Server Settings →
                    Roles → ⋯ next to the role → <strong>Copy Role ID</strong>.
                </Typography>
                <Typography variant="caption" component="div" sx={{ color: "text.secondary", mt: 0.5 }}>
                    Everyone in the role gets pinged. Test sends never ping anyone.
                </Typography>
            </Popover>
        </>
    );
}
