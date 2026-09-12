import { Box, Typography } from "@mui/material";
import HelpTip from "../HelpTip";

/**
 * One numbered step of the editor: "1  When should it post?". The number is
 * the only decoration; help hides behind a "?" so the step reads in a
 * glance.
 * @param {object} props
 * @param {number} props.number
 * @param {string} props.title
 * @param {string} [props.hint] - one short line under the title
 * @param {React.ReactNode} [props.help] - the "?" popover content
 * @param {string} [props.error] - shown under the content in red
 * @param {string} [props.field] - data-field, so a problem can scroll here
 * @param {React.ReactNode} [props.action] - something on the title row's right (a switch)
 * @param {React.ReactNode} props.children
 */
export default function Section({ number, title, hint, help, error, field, action, children }) {
    return (
        <Box component="section" data-field={field} sx={{ scrollMarginTop: 80 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 32 }}>
                <Box
                    aria-hidden
                    sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        bgcolor: error ? "error.main" : "primary.main",
                        color: error ? "error.contrastText" : "primary.contrastText",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {number}
                </Box>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {title}
                </Typography>
                {help && <HelpTip>{help}</HelpTip>}
                {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
            </Box>
            {hint && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25, ml: { sm: 5 } }}>
                    {hint}
                </Typography>
            )}
            <Box sx={{ mt: 1.5, ml: { sm: 5 } }}>{children}</Box>
            {error && (
                <Typography variant="caption" sx={{ color: "error.main", display: "block", mt: 0.75, ml: { sm: 5 } }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
}
