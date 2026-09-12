import { Box, ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SensorsIcon from "@mui/icons-material/Sensors";
import EventIcon from "@mui/icons-material/Event";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import BoltIcon from "@mui/icons-material/Bolt";
import Section from "./Section";
import { useActions, useDraft, useDraftShallow, useEditor } from "./editorContext";
import { platformLabel } from "../../../logic/notifications";

const ICONS = { live: SensorsIcon, scheduled: EventIcon, upload: VideoLibraryIcon, short: BoltIcon };

/**
 * Step 1: which detections fire the event. Each trigger is a card with the
 * server's own description, so "Scheduled" and "Short" explain themselves.
 */
export default function TriggersSection() {
    const { vocab } = useEditor();
    const error = useDraft((s) => s.problems.byPath.triggers || "");
    return (
        <Section
            number={1}
            title="When should it post?"
            hint="Pick one or more. Twitch and YouTube streams both count as going live; the other three are YouTube only."
            error={error}
            field="triggers"
        >
            <Box
                role="group"
                aria-label="Triggers"
                sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}
            >
                {vocab.triggers.map((t) => (
                    <TriggerCard key={t.id} trigger={t} />
                ))}
            </Box>
        </Section>
    );
}

function TriggerCard({ trigger }) {
    const selected = useDraftShallow((s) => s.draft.triggers.includes(trigger.id));
    const actions = useActions();
    const Icon = ICONS[trigger.id] || SensorsIcon;
    const platforms = (trigger.platforms || []).map(platformLabel).join(" · ");
    return (
        <ButtonBase
            role="checkbox"
            aria-checked={selected}
            onClick={() => actions().toggleTrigger(trigger.id)}
            data-testid={`editor-trigger-${trigger.id}`}
            sx={(theme) => {
                const c = (theme.palette.trigger || {})[trigger.id] || theme.palette.primary.main;
                return {
                    display: "flex",
                    alignItems: "flex-start",
                    textAlign: "left",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: selected ? c : "divider",
                    bgcolor: selected ? alpha(c, 0.1) : "transparent",
                    width: "100%",
                    transition: "border-color 0.15s, background-color 0.15s",
                    "&:hover": { bgcolor: selected ? alpha(c, 0.14) : "action.hover" },
                    "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                    "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                };
            }}
        >
            <Icon
                sx={(theme) => ({
                    mt: 0.25,
                    color: selected ? (theme.palette.trigger || {})[trigger.id] : "text.secondary",
                })}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{trigger.label}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {platforms}
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {trigger.description}
                </Typography>
            </Box>
            <CheckCircleIcon
                sx={{ fontSize: 20, color: selected ? "primary.main" : "transparent", flexShrink: 0 }}
                aria-hidden
            />
        </ButtonBase>
    );
}
