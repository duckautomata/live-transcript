import { Alert, AlertTitle, Box, ButtonBase } from "@mui/material";
import { useDraftShallow } from "./editorContext";
import { focusField } from "./focusField";

/**
 * Every problem a save attempt found, one per line, each a link to its
 * field. Also carries the server's answer when a save was refused.
 * @param {object} props
 * @param {string} [props.serverError]
 */
export default function ProblemsSummary({ serverError }) {
    // The problems object only changes when a validation runs, so selecting it
    // whole is stable; the entries are derived here, not in the selector.
    const byPath = useDraftShallow((s) => s.problems.byPath);
    const problems = Object.entries(byPath);
    if (!problems.length && !serverError) return null;
    return (
        <Alert severity="error" data-testid="editor-error" data-field="summary" sx={{ scrollMarginTop: 80 }}>
            <AlertTitle sx={{ fontSize: 14 }}>{serverError ? "Not saved" : "Fix these before saving"}</AlertTitle>
            {serverError && <Box sx={{ whiteSpace: "pre-line" }}>{serverError}</Box>}
            {problems.map(([path, message]) => (
                <ButtonBase
                    key={path}
                    onClick={() => focusField(path)}
                    sx={{
                        display: "block",
                        textAlign: "left",
                        font: "inherit",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                        py: 0.25,
                    }}
                >
                    {message}
                </ButtonBase>
            ))}
        </Alert>
    );
}
