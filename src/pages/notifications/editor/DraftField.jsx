import { TextField } from "@mui/material";
import { useDraft, useEditor } from "./editorContext";
import { getPath, setPath } from "./paths";

/**
 * A TextField bound to one field of the draft. It subscribes to that field
 * and its validation problem only, so typing anywhere else never renders it.
 * Past 80% of the limit the helper text becomes a counter.
 * @param {object} props
 * @param {string} props.path
 * @param {number} [props.limit] - the server's character limit
 * @param {string} [props.testId]
 * @param {object} [props.htmlInput] - extra attributes for the input element
 * @param {React.ReactNode} [props.helperText]
 */
export default function DraftField({ path, limit, testId, htmlInput, helperText, slotProps, ...rest }) {
    const { store } = useEditor();
    const value = useDraft((s) => getPath(s.draft, path)) ?? "";
    const problem = useDraft((s) => s.problems.byPath[path] || "");
    const length = String(value).length;
    const counter = limit && length >= limit * 0.8 ? `${length} / ${limit}` : null;
    return (
        <TextField
            value={value}
            onChange={(e) => setPath(store, path, e.target.value)}
            error={Boolean(problem)}
            helperText={problem || counter || helperText}
            variant="outlined"
            size="small"
            fullWidth
            slotProps={{
                ...slotProps,
                htmlInput: {
                    maxLength: limit,
                    "data-testid": testId,
                    "data-field": path,
                    ...(slotProps && slotProps.htmlInput),
                    ...htmlInput,
                },
            }}
            {...rest}
        />
    );
}
