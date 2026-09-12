import { Box, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { TRIGGER_SHORT } from "../../logic/notifications";

/**
 * A small tinted pill naming a trigger (Live, Scheduled, Upload, Short).
 * Colors come from palette.trigger so they hold up in both themes and never
 * borrow the error red.
 * @param {object} props
 * @param {string} props.trigger
 * @param {string} [props.title] - tooltip
 */
export function TriggerPill({ trigger, title }) {
    const pill = (
        <Box
            component="span"
            sx={(theme) => {
                const c = (theme.palette.trigger || {})[trigger] || theme.palette.text.secondary;
                return {
                    display: "inline-flex",
                    alignItems: "center",
                    px: 0.75,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: "18px",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    color: c,
                    bgcolor: alpha(c, 0.16),
                    whiteSpace: "nowrap",
                };
            }}
        >
            {TRIGGER_SHORT[trigger] || trigger}
        </Box>
    );
    return title ? <Tooltip title={title}>{pill}</Tooltip> : pill;
}

/**
 * A colored dot with an accessible label. Color is never the only channel:
 * every dot sits next to a word or carries a tooltip.
 * @param {object} props
 * @param {string} props.color - palette token ("success.main") or CSS color
 * @param {string} props.label
 * @param {number} [props.size]
 */
export function StatusDot({ color, label, size = 10 }) {
    return (
        <Box
            component="span"
            role="img"
            aria-label={label}
            sx={{
                width: size,
                height: size,
                borderRadius: "50%",
                bgcolor: color,
                display: "inline-block",
                flexShrink: 0,
            }}
        />
    );
}
