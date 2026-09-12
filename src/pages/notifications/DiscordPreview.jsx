import { memo } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { escapeHtml, renderDiscordMarkdown } from "../../logic/discordMarkdown";
import { isExampleImage } from "../../logic/notifications";

/**
 * A Discord-styled rendering of a preview response. Always Discord's dark
 * theme, whatever the site theme, because that is where the message lands.
 * Memoised: it renders only when a new preview arrives, never while typing.
 * The last rendering stays fully visible while the next one is fetched; a
 * thin progress line along the top is the only sign of a slow render.
 * @param {object} props
 * @param {object | null} props.preview - the server's preview response
 * @param {boolean} [props.pending] - a render has been in flight for a while
 */
function DiscordPreview({ preview, pending }) {
    const content = (preview && preview.content) || "";
    const embed = preview && preview.embed;
    const sample = (preview && preview.sample) || {};
    const now = new Date();

    /** Wrap every occurrence of the example title so nobody mistakes it for the stream's own. */
    const mark = (html) => {
        if (!sample.exampleTitle) return html;
        const marked = `<span class="dc-example" title="Example: no title was recorded for this stream. The real title takes its place in the announcement.">${escapeHtml(sample.exampleTitle)}</span>`;
        return html.split(escapeHtml(sample.exampleTitle)).join(marked);
    };

    const color =
        embed && typeof embed.color === "number" ? `#${embed.color.toString(16).padStart(6, "0")}` : "#202225";
    const footerParts = [];
    if (embed && embed.footer && embed.footer.text) footerParts.push(embed.footer.text);
    if (embed && embed.timestamp) {
        footerParts.push(
            new Date(embed.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
        );
    }

    return (
        <Box
            sx={{
                position: "relative",
                bgcolor: "#313338",
                color: "#dbdee1",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                fontSize: 15,
                lineHeight: 1.4,
                textAlign: "left",
                minHeight: 120,
                overflow: "hidden",
                "& a": { color: "#00a8fc", textDecoration: "none" },
                "& a:hover": { textDecoration: "underline" },
                "& code": { bgcolor: "#1e1f22", px: 0.5, borderRadius: 0.5, fontSize: "0.9em" },
                "& .dc-mention": {
                    bgcolor: "rgba(88,101,242,.3)",
                    color: "#c9cdfb",
                    borderRadius: 0.5,
                    px: 0.5,
                    fontWeight: 500,
                },
                "& .dc-timestamp": { bgcolor: "rgba(255,255,255,.06)", borderRadius: 0.5, px: 0.5 },
                "& .dc-example": {
                    borderBottom: "1px dashed #b39dff",
                    bgcolor: "rgba(145,70,255,.2)",
                    borderRadius: 0.5,
                    px: 0.25,
                    cursor: "help",
                },
            }}
            data-testid="discord-preview"
        >
            {pending && (
                <LinearProgress
                    sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }}
                    data-testid="preview-updating"
                />
            )}
            <Box sx={{ display: "flex", gap: 1.5 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "#5865f2",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        flexShrink: 0,
                    }}
                >
                    LT
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                        <Typography component="span" sx={{ color: "#f2f3f5", fontWeight: 600 }}>
                            Live Transcript
                        </Typography>
                        <Box
                            component="span"
                            sx={{
                                bgcolor: "#5865f2",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                px: 0.5,
                                borderRadius: 0.5,
                            }}
                        >
                            APP
                        </Box>
                        <Typography component="span" sx={{ color: "#949ba4", fontSize: 12 }}>
                            Today at {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </Typography>
                    </Box>
                    {content.trim() && (
                        <Box
                            sx={{ overflowWrap: "anywhere" }}
                            dangerouslySetInnerHTML={{ __html: mark(renderDiscordMarkdown(content)) }}
                        />
                    )}
                    {embed && (
                        <Box
                            sx={{
                                mt: 1,
                                bgcolor: "#2b2d31",
                                borderLeft: `4px solid ${color}`,
                                borderRadius: 1,
                                p: 1.5,
                                maxWidth: 520,
                            }}
                        >
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    {embed.title &&
                                        (embed.url ? (
                                            <a
                                                href={embed.url}
                                                target="_blank"
                                                rel="noopener"
                                                style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                                                dangerouslySetInnerHTML={{
                                                    __html: mark(renderDiscordMarkdown(embed.title)),
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{ color: "#f2f3f5", fontWeight: 600, mb: 0.75 }}
                                                dangerouslySetInnerHTML={{
                                                    __html: mark(renderDiscordMarkdown(embed.title)),
                                                }}
                                            />
                                        ))}
                                    {embed.description && (
                                        <Box
                                            sx={{ fontSize: 14, overflowWrap: "anywhere" }}
                                            dangerouslySetInnerHTML={{
                                                __html: mark(renderDiscordMarkdown(embed.description)),
                                            }}
                                        />
                                    )}
                                </Box>
                                {embed.thumbnail && embed.thumbnail.url && (
                                    <PreviewImage
                                        key={embed.thumbnail.url}
                                        url={embed.thumbnail.url}
                                        sample={sample}
                                        thumb
                                    />
                                )}
                            </Box>
                            {embed.image && embed.image.url && (
                                <PreviewImage key={embed.image.url} url={embed.image.url} sample={sample} />
                            )}
                            {footerParts.length > 0 && (
                                <Typography sx={{ color: "#949ba4", fontSize: 12, mt: 1 }}>
                                    {footerParts.join(" • ")}
                                </Typography>
                            )}
                        </Box>
                    )}
                    {!content.trim() && !embed && (
                        <Typography sx={{ color: "#949ba4", fontStyle: "italic", mt: 0.5 }}>
                            {preview
                                ? "(empty message - Discord would reject this; add text or turn the card on)"
                                : "Rendering…"}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default memo(DiscordPreview);

/**
 * An embed image, or the labelled example frame that stands in for the
 * Twitch preview of an offline stream.
 */
function PreviewImage({ url, sample, thumb }) {
    if (isExampleImage(url, sample)) {
        const label = "Example preview image: Twitch shows a live frame here while the stream is live";
        return (
            <Box
                role="img"
                aria-label={label}
                title={thumb ? label : undefined}
                data-testid="preview-example-image"
                sx={{
                    position: "relative",
                    width: thumb ? 80 : "100%",
                    height: thumb ? 80 : "auto",
                    maxWidth: 480,
                    aspectRatio: thumb ? "auto" : "16 / 9",
                    mt: thumb ? 0 : 1.5,
                    borderRadius: 1,
                    border: "1px dashed #9a7cff",
                    background: "radial-gradient(ellipse at 30% 20%, #3a2570 0%, #1e1a2e 55%, #17181b 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#d6ccff",
                    overflow: "hidden",
                    flexShrink: 0,
                }}
            >
                <Box
                    component="span"
                    sx={{
                        position: thumb ? "static" : "absolute",
                        top: 8,
                        left: 8,
                        bgcolor: "#9146ff",
                        color: "#fff",
                        fontSize: thumb ? 9 : 11,
                        fontWeight: 700,
                        letterSpacing: ".05em",
                        textTransform: "uppercase",
                        px: 1,
                        py: 0.25,
                        borderRadius: 0.5,
                    }}
                >
                    Example
                </Box>
                {!thumb && (
                    <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Twitch preview image</Typography>
                        <Typography sx={{ fontSize: 12, color: "#a99ee0", mt: 0.5, px: 2.5 }}>
                            A live frame of the stream appears here once it is live. Twitch has none while it is
                            offline.
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }
    return (
        <Box
            component="img"
            src={url}
            alt=""
            sx={
                thumb
                    ? { width: 80, height: 80, objectFit: "cover", borderRadius: 1, flexShrink: 0 }
                    : { display: "block", maxWidth: "100%", maxHeight: 300, borderRadius: 1, mt: 1.5 }
            }
            onError={(e) => {
                e.currentTarget.style.display = "none";
            }}
        />
    );
}
