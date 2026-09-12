import { Box, FormControlLabel, Switch } from "@mui/material";
import DraftField from "./DraftField";
import { useActions, useDraft, useEditor } from "./editorContext";

/**
 * The event's name and, when editing, whether it is active. A new event is
 * always created active, so the switch is not shown then; the name follows
 * the chosen triggers until the owner types one.
 */
export default function NameRow() {
    const { vocab } = useEditor();
    const isNew = useDraft((s) => s.isNew);
    return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <DraftField
                path="name"
                label="Event name"
                limit={vocab.limits.name}
                testId="editor-name"
                placeholder="Live pings"
                helperText="Only you see this name."
                sx={{ flex: "1 1 260px" }}
                fullWidth={false}
            />
            {!isNew && <ActiveSwitch />}
        </Box>
    );
}

function ActiveSwitch() {
    const enabled = useDraft((s) => s.draft.enabled);
    const actions = useActions();
    return (
        <FormControlLabel
            sx={{ mt: 0.25, ml: 0 }}
            control={
                <Switch
                    checked={Boolean(enabled)}
                    onChange={(e) => actions().set({ enabled: e.target.checked })}
                    slotProps={{ input: { "data-testid": "editor-enabled", "aria-label": "Active" } }}
                />
            }
            label={enabled ? "Active" : "Paused"}
        />
    );
}
