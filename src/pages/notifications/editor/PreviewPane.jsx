import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DiscordPreview from "../DiscordPreview";
import { StatusDot } from "../chips";
import { usePreview } from "../usePreview";
import { useActions, useDraft, useDraftShallow, useEditor } from "./editorContext";
import {
    TRIGGER_SHORT,
    previewBlankNotes,
    previewHasExampleImage,
    previewNoteShort,
    previewShortenedNote,
} from "../../../logic/notifications";

/**
 * The server's rendering of the draft, beside the form. It is the help
 * text: whatever a field does shows up here within half a second. The
 * preview state lives here, so a new rendering re-renders this pane only.
 * @param {object} props
 * @param {(sample: object) => void} props.onTest - opens the test dialog with the preview's sample
 * @param {() => void} props.onSignIn - a 401 from the preview means the session expired
 */
export default function PreviewPane({ onTest, onSignIn }) {
    const { store, channel, vocab } = useEditor();
    const triggers = useDraftShallow((s) => s.draft.triggers);
    const previewTrigger = useDraft((s) => s.previewTrigger);
    const actions = useActions();
    const options = triggers.length ? triggers : vocab.triggers.map((t) => t.id);
    const value = options.includes(previewTrigger) ? previewTrigger : options[0];
    const { preview, error, pending, expired, retry } = usePreview(store, channel);
    const sample = (preview && preview.sample) || {};
    const note = preview ? previewNoteShort(sample, previewHasExampleImage(preview)) : null;
    const blankNotes = previewBlankNotes(sample);
    const shortenedNote = previewShortenedNote(sample);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                // Beside the form the pane is sticky 72px down the window, so it
                // may be no taller than what is left under that (less the page's
                // 24px bottom margin): a whole video description can make the
                // card taller than the window, and a sticky pane cannot be
                // scrolled to its end. The card's box below gives up the height.
                maxHeight: { md: "calc(100vh - 96px)" },
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                    Preview
                </Typography>
                {options.length > 1 && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="preview-trigger-label">Preview as</InputLabel>
                        <Select
                            labelId="preview-trigger-label"
                            label="Preview as"
                            value={value}
                            onChange={(e) => actions().setPreviewTrigger(e.target.value)}
                            data-testid="editor-preview-trigger"
                        >
                            {options.map((id) => (
                                <MenuItem key={id} value={id}>
                                    {TRIGGER_SHORT[id] || id}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>
            {/* The pane's only scroll region, and only beside the form: it is the
                one part that shrinks, so the notes and the test button under it
                stay in view however many of them there are. On a phone the page
                itself scrolls. Nothing inside the card is cut. */}
            <Box
                sx={{ overflowY: { md: "auto" }, minHeight: { md: 120 }, borderRadius: 2 }}
                data-testid="editor-preview-scroll"
            >
                <DiscordPreview preview={preview} pending={pending} />
            </Box>
            <Box data-testid="editor-preview-note">
                {expired ? (
                    <Typography
                        variant="caption"
                        sx={{ color: "warning.main", display: "block" }}
                        data-testid="editor-preview-expired"
                    >
                        Your session expired. The draft is kept;{" "}
                        <Button size="small" onClick={onSignIn} sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}>
                            sign in again
                        </Button>{" "}
                        to keep previewing and to save.
                    </Typography>
                ) : error ? (
                    <Typography variant="caption" sx={{ color: "warning.main", display: "block" }}>
                        Preview failed: {error}{" "}
                        <Button size="small" onClick={retry} sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}>
                            Retry
                        </Button>
                    </Typography>
                ) : (
                    <>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            {note ? note.line : "Rendering…"}
                        </Typography>
                        {note && note.example && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    mt: 0.25,
                                }}
                                data-testid="editor-preview-example"
                            >
                                <StatusDot color="#9146ff" label="Example" size={8} />
                                {note.example}
                            </Typography>
                        )}
                        {blankNotes.map((blank) => (
                            <Typography
                                key={blank}
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                    display: "flex",
                                    gap: 0.75,
                                    mt: 0.25,
                                }}
                                data-testid="editor-preview-blank"
                            >
                                {/* These notes run to two lines; the dot stays on the first. */}
                                <Box component="span" sx={{ display: "flex", alignItems: "center", height: "1.66em" }}>
                                    <StatusDot color="#9e9e9e" label="Blank" size={8} />
                                </Box>
                                {blank}
                            </Typography>
                        ))}
                        {shortenedNote && (
                            <Typography
                                variant="caption"
                                sx={{ color: "text.secondary", display: "block", mt: 0.25 }}
                                data-testid="editor-preview-shortened"
                            >
                                {shortenedNote}
                            </Typography>
                        )}
                    </>
                )}
            </Box>
            <Box>
                <Button
                    startIcon={<SendIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => onTest(sample)}
                    data-testid="editor-test"
                >
                    Send a test…
                </Button>
            </Box>
        </Box>
    );
}
