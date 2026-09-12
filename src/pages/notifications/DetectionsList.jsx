import { useState } from "react";
import { Box, Button, Link, Skeleton, Typography } from "@mui/material";
import { ago, detectionItems, legLabel, platformLabel, urlLabel } from "../../logic/notifications";
import { TriggerPill } from "./chips";

const SHOWN = 10;

/**
 * What live detection recently saw on the channel: streams going live,
 * streams being scheduled, videos and shorts being published.
 * @param {object} props
 * @param {object | null} props.status - the public detection status
 */
export default function DetectionsList({ status }) {
    const [all, setAll] = useState(false);
    if (!status) {
        return (
            <Box sx={{ py: 1 }}>
                <Skeleton />
                <Skeleton width="70%" />
            </Box>
        );
    }
    const items = detectionItems(status, ago, 50).map((item) => ({
        ...item,
        meta: item.meta.replace(/via (\S+)/, (_m, mechanism) => `via ${legLabel(mechanism)}`),
    }));
    if (items.length === 0) {
        return (
            <Typography sx={{ color: "text.secondary", py: 3, textAlign: "center" }} data-testid="detections-empty">
                Nothing detected on this channel yet.
            </Typography>
        );
    }
    const shown = all ? items : items.slice(0, SHOWN);
    return (
        <Box data-testid="detections-list" sx={{ borderTop: "1px solid", borderColor: "divider" }}>
            {shown.map((item) => {
                const label = item.title || urlLabel(item.url) || item.id;
                return (
                    <Box key={item.key} sx={{ py: 1.25, px: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <TriggerPill trigger={item.kind} />
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {platformLabel(item.platform)}
                            </Typography>
                            {item.url ? (
                                <Link
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener"
                                    underline="hover"
                                    sx={{ overflowWrap: "anywhere" }}
                                >
                                    {label}
                                </Link>
                            ) : (
                                <span>{label}</span>
                            )}
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                            {ago(item.at)}
                            {item.meta ? ` · ${item.meta}` : ""}
                        </Typography>
                    </Box>
                );
            })}
            {items.length > SHOWN && !all && (
                <Button size="small" onClick={() => setAll(true)} sx={{ mt: 1 }} data-testid="detections-show-all">
                    Show all ({items.length})
                </Button>
            )}
        </Box>
    );
}
