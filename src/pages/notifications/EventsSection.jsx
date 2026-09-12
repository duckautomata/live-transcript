import { memo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Skeleton,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { hasStoredDraft } from "../../logic/eventDraft";
import { ago, eventSummary } from "../../logic/notifications";
import EmptyState from "./EmptyState";
import { StatusDot, TriggerPill } from "./chips";

/**
 * The signed-in account's events on the channel, one row each, or what a
 * visitor sees instead.
 * @param {object} props
 * @param {object | null} props.data - the notifications response
 * @param {string} [props.error]
 * @param {boolean} props.signedIn
 * @param {boolean} [props.busy]
 * @param {string} props.channel
 * @param {string} props.channelName
 * @param {string} props.owner - the signed-in username, for the draft keys
 * @param {() => void} props.onSignIn
 * @param {() => void} props.onCreateAccount
 * @param {() => void} props.onNew
 * @param {(ev: object) => void} props.onEdit
 * @param {(ev: object) => void} props.onToggle
 * @param {(ev: object) => void} props.onDelete
 */
export default function EventsSection({
    data,
    error,
    signedIn,
    busy,
    channel,
    channelName,
    owner,
    onSignIn,
    onCreateAccount,
    onNew,
    onEdit,
    onToggle,
    onDelete,
}) {
    const events = (data && data.events) || [];
    const limit = data && data.limits ? data.limits.eventsPerChannel : 0;
    const atLimit = limit > 0 && events.length >= limit;
    const draftPending = signedIn && hasStoredDraft(owner, channel, 0);

    return (
        <Box component="section" sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, minHeight: 40 }}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                    Events
                </Typography>
                {data && (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {events.length} of {limit}
                    </Typography>
                )}
                {signedIn && (
                    <Tooltip title={atLimit ? `${limit} of ${limit} - delete one to add another` : ""}>
                        <span style={{ marginLeft: "auto" }}>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={onNew}
                                disabled={busy || atLimit}
                                data-testid="events-new"
                            >
                                New event
                            </Button>
                        </span>
                    </Tooltip>
                )}
            </Box>
            {draftPending && (
                <Alert
                    severity="info"
                    sx={{ mb: 1.5 }}
                    action={
                        <Button size="small" onClick={onNew} data-testid="events-draft-continue">
                            Continue
                        </Button>
                    }
                >
                    You have an unsaved new event.
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                    Could not load your events: {error}
                </Alert>
            )}
            {!signedIn ? (
                <EmptyState signedOut channelName={channelName} onSignIn={onSignIn} onCreateAccount={onCreateAccount} />
            ) : !data && !error ? (
                <Box>
                    <Skeleton height={56} />
                    <Skeleton height={56} />
                </Box>
            ) : events.length === 0 ? (
                <Box data-testid="events-list">
                    <EmptyState channelName={channelName} />
                </Box>
            ) : (
                <Box data-testid="events-list" sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                    {events.map((ev) => (
                        <EventRow
                            key={ev.id}
                            ev={ev}
                            busy={busy}
                            channel={channel}
                            owner={owner}
                            onEdit={onEdit}
                            onToggle={onToggle}
                            onDelete={onDelete}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

const EventRow = memo(function EventRow({ ev, busy, channel, owner, onEdit, onToggle, onDelete }) {
    const [menu, setMenu] = useState(null);
    const hasDraft = hasStoredDraft(owner, channel, ev.id);
    const failing = ev.lastErrorAt && ev.lastErrorAt > (ev.lastSentAt || 0);
    const dot = failing ? "error.main" : ev.enabled ? "success.main" : "text.disabled";
    const dotLabel = failing ? "Last delivery failed" : ev.enabled ? "Active" : "Paused";
    const open = () => onEdit(ev);
    return (
        <Box
            data-testid={`event-card-${ev.id}`}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1.5,
                px: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
            }}
        >
            <StatusDot color={dot} label={dotLabel} />
            <Box sx={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={open}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <ButtonBase
                        onClick={(e) => {
                            e.stopPropagation();
                            open();
                        }}
                        data-testid={`event-open-${ev.id}`}
                        sx={(theme) => ({
                            font: "inherit",
                            fontWeight: 600,
                            overflowWrap: "anywhere",
                            textAlign: "left",
                            borderRadius: 0.5,
                            "&:hover": { textDecoration: "underline" },
                            "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                        })}
                    >
                        {ev.name}
                    </ButtonBase>
                    {(ev.triggers || []).map((t) => (
                        <TriggerPill key={t} trigger={t} />
                    ))}
                    {!ev.enabled && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Paused
                        </Typography>
                    )}
                    {hasDraft && <Chip size="small" color="warning" variant="outlined" label="Unsaved changes" />}
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
                    {eventSummary(ev)}
                </Typography>
                {ev.lastError && (
                    <Typography variant="body2" sx={{ color: "error.main", overflowWrap: "anywhere" }}>
                        Last error {ago(ev.lastErrorAt)}: {ev.lastError}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Tooltip title={ev.enabled ? "Pause" : "Resume"}>
                    <Switch
                        checked={Boolean(ev.enabled)}
                        onChange={() => onToggle(ev)}
                        disabled={busy}
                        slotProps={{
                            input: { "aria-label": `${ev.name}: active`, "data-testid": `event-toggle-${ev.id}` },
                        }}
                    />
                </Tooltip>
                <IconButton
                    aria-label={`More actions for ${ev.name}`}
                    onClick={(e) => setMenu(e.currentTarget)}
                    data-testid={`event-menu-${ev.id}`}
                    size="small"
                >
                    <MoreVertIcon />
                </IconButton>
                <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
                    <MenuItem
                        onClick={() => {
                            setMenu(null);
                            onEdit(ev);
                        }}
                        data-testid={`event-edit-${ev.id}`}
                    >
                        Edit
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setMenu(null);
                            onDelete(ev);
                        }}
                        sx={{ color: "error.main" }}
                        data-testid={`event-delete-${ev.id}`}
                    >
                        Delete…
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
});
