import { Box, Button, IconButton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useDraft, useEditor } from "./editorContext";

const HAS_BADGE = Boolean(import.meta.env.VITE_ENVIRONMENT) && import.meta.env.VITE_ENVIRONMENT !== "prod";

/**
 * The bar above the editor: back, what is being edited, and Save. Save is
 * never greyed out while idle, so a click always explains what is missing.
 * @param {object} props
 * @param {() => void} props.onBack
 * @param {() => void} props.onSave
 * @param {() => void} props.onProblems - scroll to the problem list
 * @param {boolean} props.saving
 * @param {React.ReactNode} [props.channelIcon]
 */
export default function EditorTopBar({ onBack, onSave, onProblems, saving, channelIcon }) {
    const { channelName } = useEditor();
    const isMobile = useMediaQuery("(max-width:768px)");
    const isNew = useDraft((s) => s.isNew);
    const name = useDraft((s) => s.draft.name);
    const dirty = useDraft((s) => s.dirty);
    const problemCount = useDraft((s) => s.problems.list.length);
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minHeight: 56,
                // Room for the site's floating menu button on phones, and for the
                // environment badge that floats over the top-right corner outside production.
                pl: isMobile ? 7 : { xs: 1, sm: 2 },
                pr: HAS_BADGE ? 14 : { xs: 1, sm: 2 },
            }}
        >
            <Tooltip title="Back to events">
                <IconButton onClick={onBack} aria-label="Back to events" data-testid="editor-back">
                    <ArrowBackIcon />
                </IconButton>
            </Tooltip>
            {!isMobile && channelIcon}
            <Box sx={{ minWidth: 0, flex: 1 }}>
                {!isMobile && (
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1.2 }}>
                        {channelName}
                    </Typography>
                )}
                <Typography
                    variant="subtitle1"
                    component="h1"
                    sx={{
                        fontWeight: 600,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    data-testid="editor-title"
                >
                    {isNew ? "New event" : name || "Event"}
                </Typography>
            </Box>
            {dirty && !saving && (
                <Typography variant="caption" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
                    Unsaved
                </Typography>
            )}
            {problemCount > 0 && (
                <Button
                    size="small"
                    color="error"
                    onClick={onProblems}
                    data-testid="editor-problems"
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, minWidth: 0 }}
                >
                    {problemCount} to fix
                </Button>
            )}
            <Button
                variant="contained"
                onClick={onSave}
                disabled={saving}
                data-testid="editor-save"
                sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
                {saving
                    ? "Saving…"
                    : isNew
                      ? isMobile
                          ? "Create"
                          : "Create event"
                      : isMobile
                        ? "Save"
                        : "Save changes"}
            </Button>
        </Box>
    );
}
