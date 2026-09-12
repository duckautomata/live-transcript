import { Box, Button, Typography } from "@mui/material";
import SensorsIcon from "@mui/icons-material/Sensors";
import LinkIcon from "@mui/icons-material/Link";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlined";
import DiscordPreview from "./DiscordPreview";

const STEPS = [
    { Icon: SensorsIcon, title: "Pick when", text: "Going live, a scheduled stream, a new video or a short." },
    {
        Icon: LinkIcon,
        title: "Paste a webhook",
        text: "Any Discord channel you can add a webhook to. It stays private to you.",
    },
    {
        Icon: ChatBubbleOutlineIcon,
        title: "Write the message",
        text: "Your words, role pings and a card. Preview before you save.",
    },
];

/**
 * What a visitor, or an account with no events yet, sees: an example of
 * what an event posts and the three moves it takes to make one.
 * @param {object} props
 * @param {boolean} [props.signedOut]
 * @param {string} props.channelName
 * @param {() => void} [props.onSignIn]
 * @param {() => void} [props.onCreateAccount]
 */
export default function EmptyState({ signedOut, channelName, onSignIn, onCreateAccount }) {
    const example = {
        content: "",
        embed: {
            title: `${channelName}'s Stream Started`,
            description:
                "**Example stream title**\n\n[Open on Twitch](https://www.twitch.tv/) | [Transcript](https://example.com/)",
            url: "https://www.twitch.tv/",
            color: 0x2ecc71,
        },
        sample: { exampleTitle: "Example stream title" },
    };
    return (
        <Box sx={{ py: 3, textAlign: "center" }} data-testid={signedOut ? "events-signed-out" : "events-empty"}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                {signedOut ? `Get a Discord ping when ${channelName} goes live` : `No events yet on ${channelName}`}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2.5 }}>
                {signedOut
                    ? "Free account, no email needed. Your events and webhooks are visible to nobody but you."
                    : "Use New event above to create your first one. It takes three steps:"}
            </Typography>
            <Box sx={{ maxWidth: 520, mx: "auto", mb: 1 }}>
                <DiscordPreview preview={example} />
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 3 }}>
                An example of what an event posts. Yours can say anything.
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                    maxWidth: 720,
                    mx: "auto",
                    textAlign: "left",
                }}
            >
                {STEPS.map((step, i) => (
                    <Box key={step.title} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                            aria-hidden
                        >
                            <step.Icon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                                {i + 1}. {step.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {step.text}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
            {signedOut && (
                <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", mt: 3 }}>
                    <Button variant="contained" onClick={onCreateAccount} data-testid="events-sign-in">
                        Create a free account
                    </Button>
                    <Button variant="text" onClick={onSignIn} data-testid="events-sign-in-existing">
                        I already have one
                    </Button>
                </Box>
            )}
        </Box>
    );
}
