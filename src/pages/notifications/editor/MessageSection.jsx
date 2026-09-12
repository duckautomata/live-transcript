import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import DraftField from "./DraftField";
import EmbedSection from "./EmbedSection";
import InsertBar from "./InsertBar";
import Section from "./Section";
import { useEditor } from "./editorContext";

const HELP = (
    <>
        Placeholders like <code>{"{title}"}</code> are filled in from the stream or video when the event fires; click a
        chip to insert one. Discord markdown works: **bold**, [text](url).
        <br />
        <br />
        Only what you write in the message can ping anyone. A stream title containing @everyone never pings.
    </>
);

/**
 * Step 3: the message above the card, and the card itself.
 */
export default function MessageSection() {
    const { vocab } = useEditor();
    const contentRef = useRef(null);
    return (
        <Section
            number={3}
            title="What should it say?"
            hint="The message is the text above the card. Role pings go here."
            help={HELP}
            field="content"
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box>
                    <DraftField
                        path="content"
                        label="Message"
                        multiline
                        minRows={3}
                        maxRows={8}
                        limit={vocab.limits.content}
                        testId="editor-content"
                        inputRef={contentRef}
                        placeholder="Optional. e.g. {channel} is live! {url}"
                    />
                    <InsertBar path="content" inputRef={contentRef} rolePing />
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.75 }}>
                        Chips insert at the cursor. Markdown works: **bold**, [text](url).
                    </Typography>
                </Box>
                <EmbedSection />
            </Box>
        </Section>
    );
}
