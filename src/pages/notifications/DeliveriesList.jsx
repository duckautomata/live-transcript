import { useState } from "react";
import { Box, Button, Link, Typography } from "@mui/material";
import { DELIVERY_STATUS, ago, urlLabel } from "../../logic/notifications";
import { StatusDot, TriggerPill } from "./chips";

const SHOWN = 10;

/**
 * The signed-in account's delivery trail on the channel: what its events
 * sent, what was skipped by a minimum gap, what failed and why.
 * @param {object} props
 * @param {object[]} props.log
 */
export default function DeliveriesList({ log }) {
    const [all, setAll] = useState(false);
    if (!log || log.length === 0) {
        return (
            <Typography sx={{ color: "text.secondary", py: 3, textAlign: "center" }} data-testid="deliveries-empty">
                Nothing sent yet. Sends, skipped pings and tests show up here.
            </Typography>
        );
    }
    const shown = all ? log : log.slice(0, SHOWN);
    return (
        <Box data-testid="deliveries-list" sx={{ borderTop: "1px solid", borderColor: "divider" }}>
            {shown.map((e) => {
                const title = e.title || urlLabel(e.url) || e.broadcastId || "(untitled)";
                const status = DELIVERY_STATUS[e.status] || { color: "text.disabled", word: e.status };
                const delivered = e.status === "suppressed" ? "" : ` · ${e.delivered}/${e.webhooks} delivered`;
                return (
                    <Box key={e.id} sx={{ py: 1.25, px: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <StatusDot color={status.color} label={status.word} size={8} />
                            <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 52 }}>
                                {status.word}
                            </Typography>
                            <TriggerPill trigger={e.trigger} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {e.eventName || "(unnamed)"}
                            </Typography>
                            {e.url ? (
                                <Link
                                    href={e.url}
                                    target="_blank"
                                    rel="noopener"
                                    underline="hover"
                                    sx={{ overflowWrap: "anywhere" }}
                                >
                                    {title}
                                </Link>
                            ) : (
                                <Typography variant="body2">{title}</Typography>
                            )}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block", mt: 0.25, overflowWrap: "anywhere" }}
                        >
                            {ago(e.sentAt)}
                            {delivered}
                            {e.detail ? ` · ${e.detail}` : ""}
                        </Typography>
                    </Box>
                );
            })}
            {log.length > SHOWN && !all && (
                <Button size="small" onClick={() => setAll(true)} sx={{ mt: 1 }} data-testid="deliveries-show-all">
                    Show all ({log.length})
                </Button>
            )}
        </Box>
    );
}
