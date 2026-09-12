import { useState } from "react";
import { IconButton, Popover, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";

/**
 * A small "?" that opens a short explanation. Help lives here instead of in
 * paragraphs on the page, so the form stays readable and the help is there
 * for whoever wants it.
 * @param {object} props
 * @param {React.ReactNode} props.children - the explanation
 * @param {string} [props.label] - accessible name
 */
export default function HelpTip({ children, label = "Help" }) {
    const [anchor, setAnchor] = useState(null);
    return (
        <>
            <IconButton
                size="small"
                aria-label={label}
                onClick={(e) => setAnchor(e.currentTarget)}
                sx={{ color: "text.secondary", p: 0.25 }}
            >
                <HelpOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: { sx: { maxWidth: 340, p: 1.5 } } }}
            >
                <Typography variant="body2" component="div">
                    {children}
                </Typography>
            </Popover>
        </>
    );
}
