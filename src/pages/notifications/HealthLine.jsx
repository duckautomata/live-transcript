import { useState } from "react";
import { Box, Button, Collapse, Skeleton, Typography } from "@mui/material";
import { StatusDot } from "./chips";
import { ago, detectionSummary, legLabel, platformLabel } from "../../logic/notifications";

const LEG_COLORS = { ok: "success.main", degraded: "warning.main", down: "error.main", idle: "text.disabled" };
const LEG_STATES = { ok: "working", degraded: "quiet", down: "down", idle: "waiting" };
const SUMMARY_COLORS = {
    success: "success.main",
    warning: "warning.main",
    error: "error.main",
    default: "text.disabled",
};

/**
 * One line saying whether live detection is watching this channel, with the
 * per-mechanism details folded away for whoever wants them.
 * @param {object} props
 * @param {object | null} props.status - the public detection status
 * @param {string} [props.error]
 */
export default function HealthLine({ status, error }) {
    const [open, setOpen] = useState(false);
    if (error) {
        return (
            <Line data-testid="detection-status">
                <StatusDot color="text.disabled" label="Status unavailable" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Live detection
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    status unavailable · {error}
                </Typography>
            </Line>
        );
    }
    if (!status) {
        return (
            <Line>
                <Skeleton width={260} />
            </Line>
        );
    }
    const summary = detectionSummary(status);
    const platforms = (status.watching || []).map(platformLabel);
    const legs = (status.legs || []).slice().sort((a, b) => a.mechanism.localeCompare(b.mechanism));
    return (
        <Box sx={{ mb: 3 }} data-testid="detection-status">
            <Line>
                <StatusDot color={SUMMARY_COLORS[summary.color] || "text.disabled"} label={summary.label} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Live detection
                </Typography>
                <Typography variant="body2" data-testid="detection-state">
                    {summary.label}
                </Typography>
                {platforms.length > 0 && (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        · watching {platforms.join(" and ")}
                    </Typography>
                )}
                {status.enabled && status.queueIncoming && (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        · also transcribes
                    </Typography>
                )}
                {legs.length > 0 && (
                    <Button
                        size="small"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        data-testid="detection-details"
                        sx={{ ml: "auto" }}
                    >
                        {open ? "Hide details" : "Details"}
                    </Button>
                )}
            </Line>
            {summary.color !== "success" && (
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, ml: 2.5 }}>
                    {summary.detail}
                </Typography>
            )}
            <Collapse in={open}>
                <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1, ml: 2.5 }}
                    data-testid="health-legs"
                >
                    {status.enabled && status.queueIncoming && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            A detected stream is also queued for transcription automatically.
                        </Typography>
                    )}
                    {legs.map((leg) => (
                        <Box key={leg.mechanism} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <StatusDot color={LEG_COLORS[leg.state] || "text.disabled"} label={leg.state} size={8} />
                            <Typography variant="body2">{legLabel(leg.mechanism)}</Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {LEG_STATES[leg.state] || leg.state}
                                {leg.lastSuccess ? ` · last success ${ago(leg.lastSuccess)}` : ""}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
}

function Line({ children, ...rest }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", minHeight: 32 }} {...rest}>
            {children}
        </Box>
    );
}
