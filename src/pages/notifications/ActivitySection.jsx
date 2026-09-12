import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import DeliveriesList from "./DeliveriesList";
import DetectionsList from "./DetectionsList";

/**
 * What live detection recently saw on the channel, and what the account's
 * events sent. Secondary to the events, so it sits below them.
 * @param {object} props
 * @param {object | null} props.status
 * @param {boolean} props.signedIn
 * @param {object[]} props.log
 * @param {"detections" | "deliveries"} props.activity
 * @param {(value: string) => void} props.onActivity
 */
export default function ActivitySection({ status, signedIn, log, activity, onActivity }) {
    return (
        <Box component="section">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                    Activity
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={activity}
                    onChange={(_e, v) => {
                        if (v) onActivity(v);
                    }}
                    aria-label="Activity"
                    sx={{ ml: "auto" }}
                >
                    <ToggleButton
                        value="detections"
                        data-testid="tab-detections"
                        sx={{ textTransform: "none", px: 1.5 }}
                    >
                        Recent detections
                    </ToggleButton>
                    <ToggleButton
                        value="deliveries"
                        data-testid="tab-deliveries"
                        sx={{ textTransform: "none", px: 1.5 }}
                    >
                        Deliveries
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            {activity === "detections" ? (
                <DetectionsList status={status} />
            ) : signedIn ? (
                <DeliveriesList log={log} />
            ) : (
                <Typography sx={{ color: "text.secondary", py: 3, textAlign: "center" }}>
                    Sign in to see what your events sent.
                </Typography>
            )}
        </Box>
    );
}
