import { useState } from "react";
import { Box, Button, Chip, Popover, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import NotesIcon from "@mui/icons-material/Notes";
import { insertAtCaret } from "./paths";
import { useEditor } from "./editorContext";
import { linesToken } from "../../../logic/notifications";

/**
 * The row of placeholder chips under a template field. Each chip inserts
 * its placeholder into that field at the caret, so there is never a
 * question of which field a click lands in. A placeholder the server marks
 * as taking a line count gets a chooser chip up front instead of a plain
 * one; a server that marks none shows plain chips only.
 * @param {object} props
 * @param {string} props.path - the draft field the bar belongs to
 * @param {{current: any}} props.inputRef
 * @param {boolean} [props.mentions] - offer the "@ Mention" chip (message only: pings live there)
 */
export default function InsertBar({ path, inputRef, mentions }) {
    const { store, vocab } = useEditor();
    const insert = (text, opts) => insertAtCaret(store, path, inputRef, text, opts);
    return (
        <Box
            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", mt: 1 }}
            data-testid={`editor-insertbar-${path}`}
        >
            {mentions && <MentionChip onInsert={insert} />}
            {vocab.placeholders
                .filter((p) => p.lines)
                .map((p) => (
                    <LinesChip key={p.name} placeholder={p} onInsert={insert} />
                ))}
            {vocab.placeholders
                .filter((p) => !p.lines)
                .map((p) => (
                    <Chip
                        key={p.name}
                        size="small"
                        variant="outlined"
                        label={p.name}
                        title={p.description}
                        onClick={() => insert(p.name)}
                        data-testid={`editor-insert-${p.name.replace(/[{}]/g, "")}`}
                        sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12 }}
                    />
                ))}
        </Box>
    );
}

/**
 * The paper both choosers open in. Setting a max width replaces the one MUI
 * uses to keep a popover on screen, so a phone narrower than the chooser
 * needs that limit spelled out again or the paper hangs off the left edge.
 */
const CHOOSER_PAPER = { sx: { p: 2, maxWidth: "min(380px, calc(100% - 32px))" } };

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
                slotProps={{ paper: CHOOSER_PAPER }}
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

/** How much of a multi-line placeholder to take, in the order the chooser offers it. */
const AMOUNTS = [
    { value: "first", label: "First line" },
    { value: "lines", label: "First few lines" },
    { value: "all", label: "All of it" },
];

/**
 * The chooser chip for a placeholder that takes a line count (the video
 * description): asks how much of it to include and inserts the matching
 * token on a line of its own. The choice is kept while the editor is open,
 * so the second insert is two clicks.
 * @param {object} props
 * @param {{name: string, description: string, label?: string, lines: {max: number, default: number}}} props.placeholder
 * @param {(text: string, opts?: {ownLine?: boolean}) => void} props.onInsert
 */
function LinesChip({ placeholder: p, onInsert }) {
    const [anchor, setAnchor] = useState(null);
    const [mode, setMode] = useState("first");
    const [count, setCount] = useState(String(p.lines.default));
    const n = Number(count);
    // One line is "First line"; from two up it is a count.
    const ok = mode !== "lines" || (count !== "" && n >= 2 && n <= p.lines.max);
    // Until the count is usable the token shows N in its place, and Insert is off.
    const token = linesToken(p.name, mode, ok ? n : "N");
    const close = () => setAnchor(null);
    const insert = () => {
        // The popover stays clickable while it fades out; a double click must not insert twice.
        if (!anchor) return;
        // A line to itself: the text is multi-line, and the server only drops
        // a blank placeholder's line when nothing else is written on it.
        onInsert(token, { ownLine: true });
        close();
    };
    return (
        <>
            <Chip
                size="small"
                color="primary"
                variant="outlined"
                icon={<NotesIcon />}
                // The arrow lives in the label: Chip's own trailing icon is a
                // delete button, and Backspace on the chip would trigger it.
                label={
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
                        {p.label || p.name}
                        <ArrowDropDownIcon sx={{ fontSize: 18, ml: 0.25, mr: -0.75 }} />
                    </Box>
                }
                title={p.description}
                onClick={(e) => setAnchor(e.currentTarget)}
                data-testid="editor-description"
                sx={{ fontWeight: 600 }}
            />
            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={close}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: CHOOSER_PAPER }}
            >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    How much of the video&apos;s description?
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={mode}
                    onChange={(_e, v) => {
                        if (v) setMode(v);
                    }}
                    aria-label="How much of the description"
                    sx={{ mb: 1.5 }}
                >
                    {AMOUNTS.map((a) => (
                        <ToggleButton
                            key={a.value}
                            value={a.value}
                            data-testid={`editor-description-${a.value}`}
                            sx={{ px: 1.5 }}
                        >
                            {a.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                {mode === "lines" && (
                    <TextField
                        label="How many lines"
                        value={count}
                        onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && ok) {
                                e.preventDefault();
                                insert();
                            }
                        }}
                        error={count !== "" && !ok}
                        helperText={`2 to ${p.lines.max}. Blank lines don't count.`}
                        variant="outlined"
                        size="small"
                        fullWidth
                        autoFocus
                        slotProps={{ htmlInput: { inputMode: "numeric", "data-testid": "editor-description-count" } }}
                        sx={{ mb: 1 }}
                    />
                )}
                <Typography variant="caption" component="div" sx={{ color: "text.secondary" }}>
                    {mode === "first" &&
                        "Just the first line of text, usually the one-sentence pitch. A very long line is cut short with …"}
                    {mode === "lines" &&
                        `The first ${ok ? n : "few"} lines of text. Blank lines between them are kept but don't count.`}
                    {mode === "all" &&
                        "The whole description. If it is too long for Discord, the description is what gets shortened, so the rest of your message always fits."}
                </Typography>
                <Typography
                    variant="caption"
                    component="div"
                    sx={{ color: "text.secondary", mt: 0.5 }}
                    data-testid="editor-description-token"
                >
                    Inserts <code>{token}</code>.
                    {mode !== "all" && " The number is how many lines; you can change it by hand later."}
                </Typography>
                <Typography variant="caption" component="div" sx={{ color: "text.secondary", mt: 0.5 }}>
                    YouTube only. Twitch streams have no description, so there it comes up blank, and a line with
                    nothing else on it disappears.
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    disabled={!ok}
                    onClick={insert}
                    // Chip, then Enter: the first line is in without touching the mouse.
                    autoFocus={mode !== "lines"}
                    data-testid="editor-description-insert"
                    sx={{ mt: 1.5 }}
                >
                    Insert
                </Button>
            </Popover>
        </>
    );
}
