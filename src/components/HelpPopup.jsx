import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Link,
    Typography,
} from "@mui/material";
import settings_img from "../assets/helpguide/settings.png";
import wordCount_img from "../assets/helpguide/word-count.png";
import pageToggle_img from "../assets/helpguide/page-toggle.png";
import transcript_img from "../assets/helpguide/transcript.png";
import tagHighlightText_img from "../assets/helpguide/tag-highlihgt-text-light.png";
import tagMenu_img from "../assets/helpguide/tag-menu.png";
import messageId_img from "../assets/helpguide/message-ID.png";
import filledOutTagMenu_img from "../assets/helpguide/filled-out-tag-menu.png";
import { ExpandMore } from "@mui/icons-material";

export default function HelpPopup({ open, setOpen }) {
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">How to Use Live Transcript</DialogTitle>
                <DialogContent>
                    <div>
                        <p>
                            A guide can also be found here:{" "}
                            <Link href="https://github.com/duckautomata/live-transcript/blob/master/README.md#how-to-use">
                                Live Transcript GitHub
                            </Link>
                        </p>

                        {/* Settings */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    Settings are at the top right of the page. Click the cogwheel icon to view the
                                    settings menu.
                                </Typography>
                                <img src={settings_img} />
                                <Typography variant="body1" gutterBottom>
                                    There are currently 4 settings. All settings are stored in a cookie and persist
                                    across sessions.
                                </Typography>
                                <ul>
                                    <li>
                                        Theme: Select the color theme of the site. Light, Dark, or System default.
                                        <blockquote>
                                            System default will use whatever you set in your operating system. This is
                                            set by default.
                                        </blockquote>
                                    </li>
                                    <li>
                                        New Lines at Top
                                        <blockquote>
                                            When enabled, new lines will appear at the top. When disabled, new lines
                                            will appear at the bottom. When disabled, you will need to constantly scroll
                                            down to see the newest lines.
                                        </blockquote>
                                    </li>
                                    <li>
                                        Enable Tag Helper
                                        <blockquote>
                                            This enables a feature to help time a tag with the text that appears in the
                                            transcript. This will be explained further in Tagging Feature.
                                        </blockquote>
                                    </li>
                                    <li>
                                        Streamer
                                        <blockquote>
                                            This denotes what transcript to pull in. Currently only supports Doki.
                                        </blockquote>
                                    </li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>

                        {/* Pages */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Pages</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    Different pages can be get to by using the toggle buttons at the bottom of the page.
                                </Typography>
                                <img src={pageToggle_img} />
                                <Typography variant="body1" gutterBottom>
                                    There are currently 2 pages: Word Count and Transcript. You can find more about them
                                    below.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        {/* Word Count */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Word Count</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    Word Count allows you to view the usage of a word or text in real time over the
                                    course of the stream. The graph and values will automatically update.
                                </Typography>
                                <img src={wordCount_img} width="100%" />
                                <Typography variant="body1" gutterBottom>
                                    The only requirement is that the word is 3 or more characters long.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    To view the graph value, either hover over it with your mouse if you are on PC, or
                                    tap/drag on the graph if you are on mobile.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        {/* Transcript */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Transcript</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    Transcript allows you to view back what was said during the stream. This updates in
                                    real time so there is no need to refresh.
                                </Typography>
                                <Typography variant="body1" color="error" gutterBottom>
                                    NOTE: The transcripts are not guaranteed to be accurate to what was said on stream,
                                    or if the streamer said it, or it was said in game or by someone else. Please use
                                    this with caution.
                                </Typography>
                                <img src={transcript_img} width="100%" />
                                <Typography variant="body1" gutterBottom>
                                    There are 3 parts to the transcript page.
                                    <ol>
                                        <li>The title</li>
                                        <li>The stream status (live or offline)</li>
                                        <li>The transcripts themselves</li>
                                    </ol>
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    The transcripts are broken up into 3 parts.
                                    <ol>
                                        <li>The id (in red)</li>
                                        <li>The timestamp (in your local time)</li>
                                        <li>The text</li>
                                    </ol>
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        {/* Tagging */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Tagging Feature</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    The tagging feature allows you to time a tag to a place in the transcript. This
                                    feature is off by default, so you will need to enable it in the settings.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Once enabled, you will be able to hover over the text in the transcript and click
                                    specific sections (denoted by the color box that appears).
                                </Typography>
                                <img src={tagHighlightText_img} width="100%" />
                                <Typography variant="body1" gutterBottom>
                                    These sections denote a specific part where you can set the tag to (the tags will be
                                    set to the beginning of the section).
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Once you find the section you want to time a tag to; click it and a menu will
                                    appear.
                                </Typography>
                                <img src={tagMenu_img} />
                                <Typography variant="body1" gutterBottom>
                                    This is the tagging alignment menu. It takes the discord message ID of your tag, and
                                    calculates the offset you need for it to align with the beginning of the segment you
                                    selected.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    If you do not know how to get the message ID of your tag:
                                    <ol>
                                        <li>
                                            Enable developer mode. Settings {"->"} Advanced {"->"} Enable developer mode
                                        </li>
                                        <li>Right-click on your message and click Copy Message ID</li>
                                    </ol>
                                </Typography>
                                <img src={messageId_img} />
                                <Typography variant="body1" gutterBottom>
                                    The default offset is whatever your server's tagger bot is set to. For DPS, it is
                                    -20. This value is also stored in the cookie, so you will only have to change it
                                    once.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Once both values are set, it will display the adjust command to run. As well as
                                    enable the button Copy Command to copy the command to your clipboard.
                                </Typography>
                                <img src={filledOutTagMenu_img} />
                                <Typography variant="body1" gutterBottom>
                                    Note:
                                    <ol>
                                        <li>
                                            As said above, this will time the tag to the beginning of the section you
                                            clicked. Meaning, that if an entire line is one section, then it will time
                                            it to go at the beginning of that line. The only way to make it start in the
                                            middle of a section is to guess how long a section is and change the offset
                                            accordingly.
                                        </li>
                                        <li>
                                            The timings seem to be very accurate. When you want to start at the
                                            beginning of the section, it might be best to move it back by one second to
                                            give the YT player time to start the video/audio. Though this should be
                                            determined after testing it out for a few streams.
                                        </li>
                                    </ol>
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}