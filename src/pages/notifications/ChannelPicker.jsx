import { useEffect, useRef } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";

/**
 * The channel the page is about, as a row of avatar pills. Scrolls sideways
 * on narrow screens, with the chosen one brought into view.
 * @param {object} props
 * @param {{value: string, name: string, icon: React.ReactNode}[]} props.channels
 * @param {string} props.channel
 * @param {(value: string) => void} props.onChange
 */
export default function ChannelPicker({ channels, channel, onChange }) {
    const selectedRef = useRef(null);
    useEffect(() => {
        if (selectedRef.current && typeof selectedRef.current.scrollIntoView === "function") {
            selectedRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }, [channel]);
    return (
        <Box
            role="group"
            aria-label="Channel"
            sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 1,
                mb: 2,
                scrollSnapType: "x proximity",
                scrollbarWidth: "thin",
                maskImage: { xs: "linear-gradient(to right, black 92%, transparent)", sm: "none" },
            }}
        >
            {channels.map((c) => {
                const selected = c.value === channel;
                return (
                    <ButtonBase
                        key={c.value}
                        ref={selected ? selectedRef : undefined}
                        onClick={() => onChange(c.value)}
                        aria-pressed={selected}
                        data-testid={`channel-${c.value}`}
                        sx={(theme) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            pl: 0.5,
                            pr: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            border: "1px solid",
                            borderColor: selected ? "primary.main" : "divider",
                            bgcolor: selected ? "action.selected" : "transparent",
                            flexShrink: 0,
                            scrollSnapAlign: "start",
                            "&:hover": { bgcolor: selected ? "action.selected" : "action.hover" },
                            "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                        })}
                    >
                        {c.icon}
                        <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 500, whiteSpace: "nowrap" }}>
                            {c.name}
                        </Typography>
                    </ButtonBase>
                );
            })}
        </Box>
    );
}
