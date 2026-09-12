import { useRef, useState } from "react";
import {
    Box,
    Button,
    ButtonBase,
    Collapse,
    FormControlLabel,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DraftField from "./DraftField";
import InsertBar from "./InsertBar";
import { useActions, useDraft, useEditor } from "./editorContext";
import { hasCustomExtras } from "../../../logic/eventDraft";

const SWATCHES = ["#2ECC71", "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#9146FF", "#FF0000"];

/**
 * The card (Discord embed) under the message: a switch, the fields most
 * people touch, and the rest behind "More".
 */
export default function EmbedSection() {
    const { store, vocab } = useEditor();
    const enabled = useDraft((s) => s.draft.embedEnabled);
    const actions = useActions();
    const [more, setMore] = useState(() => hasCustomExtras(store.getState().draft, vocab.defaults));
    const descriptionRef = useRef(null);

    return (
        <Box
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
            }}
            data-field="embed"
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <FormControlLabel
                    sx={{ ml: 0, mr: 0 }}
                    control={
                        <Switch
                            checked={Boolean(enabled)}
                            onChange={(e) => actions().set({ embedEnabled: e.target.checked })}
                            slotProps={{ input: { "data-testid": "editor-embed-enabled" } }}
                        />
                    }
                    label={<Typography sx={{ fontWeight: 600 }}>Include a card (embed)</Typography>}
                />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {enabled ? "The card under the message." : "Off: the event posts text only."}
                </Typography>
            </Box>
            <Collapse in={Boolean(enabled)} unmountOnExit>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    <DraftField
                        path="embed.title"
                        label="Card title"
                        limit={vocab.limits.embedTitle}
                        testId="editor-embed-title"
                    />
                    <Box>
                        <DraftField
                            path="embed.description"
                            label="Card description"
                            multiline
                            minRows={3}
                            maxRows={10}
                            limit={vocab.limits.embedDescription}
                            testId="editor-embed-description"
                            inputRef={descriptionRef}
                        />
                        <InsertBar path="embed.description" inputRef={descriptionRef} />
                    </Box>
                    <ColorRow />
                    <DraftField
                        path="embed.url"
                        label="Title link"
                        placeholder="{url}"
                        helperText="Where the title points. {url} is the stream or video."
                        testId="editor-embed-url"
                    />
                    <Box>
                        <Button
                            size="small"
                            onClick={() => setMore((v) => !v)}
                            aria-expanded={more}
                            endIcon={
                                <ExpandMoreIcon
                                    sx={{ transform: more ? "rotate(180deg)" : "none", transition: "0.15s" }}
                                />
                            }
                            data-testid="editor-embed-more"
                        >
                            {more ? "Fewer options" : "Image, footer and more"}
                        </Button>
                    </Box>
                    <Collapse in={more}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <ImageChoice />
                            <DraftField
                                path="embed.thumbnail"
                                label="Small thumbnail URL"
                                helperText="A small image in the card's corner. Usually left empty."
                                testId="editor-embed-thumbnail"
                            />
                            <DraftField
                                path="embed.footer"
                                label="Footer"
                                limit={vocab.limits.embedFooter}
                                testId="editor-embed-footer"
                            />
                            <TimestampSwitch />
                            <Box>
                                <Button
                                    size="small"
                                    onClick={() => actions().resetEmbed()}
                                    data-testid="editor-embed-reset"
                                >
                                    Reset the card to the default look
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Box>
            </Collapse>
        </Box>
    );
}

/** Preset swatches, the hex value, and a native picker for anything else. */
function ColorRow() {
    const color = useDraft((s) => (s.draft.embed || {}).color || "");
    const actions = useActions();
    const current = /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim().toUpperCase() : null;
    return (
        <Box>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
                Accent color
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {SWATCHES.map((c) => (
                    <Tooltip key={c} title={c}>
                        <ButtonBase
                            aria-label={`Use ${c}`}
                            aria-pressed={current === c}
                            onClick={() => actions().setEmbed({ color: c })}
                            sx={(theme) => ({
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                bgcolor: c,
                                boxShadow:
                                    current === c
                                        ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${c}`
                                        : "none",
                                "&:focus-visible": {
                                    outline: `2px solid ${theme.palette.primary.main}`,
                                    outlineOffset: 2,
                                },
                            })}
                        />
                    </Tooltip>
                ))}
                <Tooltip title="Custom color…">
                    <Box
                        component="label"
                        data-testid="editor-embed-color-custom"
                        sx={(theme) => ({
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            cursor: "pointer",
                            // Always the hue wheel, so it reads as "pick any color", never as a preset.
                            background: "conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow:
                                current && !SWATCHES.includes(current)
                                    ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${current}`
                                    : "none",
                            "&:focus-within": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                        })}
                    >
                        <input
                            type="color"
                            aria-label="Custom color"
                            value={current || "#2ECC71"}
                            onChange={(e) => actions().setEmbed({ color: e.target.value.toUpperCase() })}
                            style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                        />
                    </Box>
                </Tooltip>
                <DraftField
                    path="embed.color"
                    label="Hex"
                    placeholder="#2ECC71"
                    testId="editor-embed-color"
                    fullWidth={false}
                    sx={{ width: 130 }}
                    htmlInput={{ maxLength: 7, spellCheck: false }}
                />
            </Box>
        </Box>
    );
}

/** The big image: the platform's thumbnail, nothing, or a URL of the owner's own. */
function ImageChoice() {
    const image = useDraft((s) => (s.draft.embed || {}).image || "");
    const actions = useActions();
    const [custom, setCustom] = useState(() => image !== "" && image !== "{thumbnail}");
    const choice = custom ? "custom" : image === "{thumbnail}" ? "thumbnail" : "none";
    const choose = (_e, value) => {
        if (!value) return;
        if (value === "custom") {
            setCustom(true);
            if (image === "{thumbnail}") actions().setEmbed({ image: "" });
            return;
        }
        setCustom(false);
        actions().setEmbed({ image: value === "thumbnail" ? "{thumbnail}" : "" });
    };
    return (
        <Box>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
                Big image
            </Typography>
            <ToggleButtonGroup exclusive size="small" value={choice} onChange={choose} aria-label="Big image">
                <ToggleButton value="thumbnail" data-testid="editor-embed-image-thumbnail">
                    Stream preview
                </ToggleButton>
                <ToggleButton value="none" data-testid="editor-embed-image-none">
                    None
                </ToggleButton>
                <ToggleButton value="custom" data-testid="editor-embed-image-custom">
                    Custom URL
                </ToggleButton>
            </ToggleButtonGroup>
            {custom && (
                <DraftField
                    path="embed.image"
                    label="Image URL"
                    placeholder="https://…"
                    testId="editor-embed-image"
                    sx={{ mt: 1.5 }}
                />
            )}
        </Box>
    );
}

function TimestampSwitch() {
    const timestamp = useDraft((s) => Boolean((s.draft.embed || {}).timestamp));
    const actions = useActions();
    return (
        <FormControlLabel
            sx={{ ml: 0 }}
            control={
                <Switch
                    checked={timestamp}
                    onChange={(e) => actions().setEmbed({ timestamp: e.target.checked })}
                    slotProps={{ input: { "data-testid": "editor-embed-timestamp" } }}
                />
            }
            label="Show the stream or video time in the footer"
        />
    );
}
