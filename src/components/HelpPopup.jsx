import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import settings_img from "../assets/helpguide/settings.png";
import wordCount_img from "../assets/helpguide/word-count.png";
import transcript_img from "../assets/helpguide/transcript.png";
import linemenu_img from "../assets/helpguide/linemenu-example.png";
import audioplayerDesktop_img from "../assets/helpguide/audioplayer-desktop.png";
import tagHighlightText_img from "../assets/helpguide/tag-highlihgt-text-light.png";
import tagMenu_img from "../assets/helpguide/tag-menu.png";
import messageId_img from "../assets/helpguide/message-ID.png";
import filledOutTagMenu_img from "../assets/helpguide/filled-out-tag-menu.png";
import sidebar_img from "../assets/helpguide/sidebar.png";
import clippingStarted_img from "../assets/helpguide/clipping-started.png";
import clippingMenuDownload_img from "../assets/helpguide/clipping-menu-download.png";
import clippingPopup_img from "../assets/helpguide/clipping-popup.png";
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
                                    Settings are at the left of the page. Click the cogwheel icon to view the settings
                                    menu.
                                </Typography>
                                <img src={settings_img} width="75%" />
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
                                        Density: How much space should be between lines.
                                        <blockquote>Select whichever makes it easier to read.</blockquote>
                                    </li>
                                    <li>
                                        Time Format: How you want the timestamp for each line to be formatted.
                                        <blockquote>
                                            Relative displays the time since the stream has started. Local displays the
                                            time in your local timezone.
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
                                </ul>
                            </AccordionDetails>
                        </Accordion>

                        {/* Sidebar */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Sidebar</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    Allows you to easily jump between pages and streamers. Located on the left of your
                                    screen.
                                </Typography>
                                <img src={sidebar_img} width="50%" />
                                <Typography variant="body1" gutterBottom>
                                    Sidebar is broken up into 3 parts.
                                </Typography>
                                <ul>
                                    <li>
                                        Transcripts
                                        <blockquote>
                                            Select which transcripts you wish to load. Currently there are: Doki and
                                            Mint.
                                        </blockquote>
                                    </li>
                                    <li>
                                        Pages
                                        <blockquote>
                                            Select how you want to use the transcripts. Either view them, graph them, or
                                            use it to fix tags.
                                        </blockquote>
                                    </li>
                                    <li>
                                        Other
                                        <blockquote>
                                            General options. View github url, open the help menu (this), or change the
                                            site settings.
                                        </blockquote>
                                    </li>
                                </ul>
                                <Typography variant="body1" gutterBottom>
                                    Note: you must select a transcript before you can select a page.
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
                                <Typography>Transcript Viewer</Typography>
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
                                There are 3 parts to the transcript page.
                                <ol>
                                    <li>The title</li>
                                    <li>The stream status (live or offline)</li>
                                    <li>The transcripts themselves</li>
                                </ol>
                                The transcripts are broken up into 3 parts.
                                <ol>
                                    <li>The id (in green)</li>
                                    <li>The timestamp (in your local time)</li>
                                    <li>The text</li>
                                </ol>
                                The id is a clickable button. Click on it to open a menu. This is where you can
                                <ul>
                                    <li>Start a clip (explained more in the Clipping section)</li>
                                    <li>Play or download the audio</li>
                                    <li>Open the stream to this spot if DVR or Vod is available</li>
                                    <li>Copy the unix timestamp of when the line starts</li>
                                </ul>
                                <img src={linemenu_img} width="100%" />
                                Do note that the &#34;Open Stream&#34; option is not 100% accurate since we do not know
                                exactly when the stream started.
                            </AccordionDetails>
                        </Accordion>

                        {/* Audio Player */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Audio Player</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    When you click on a line id and select &#34;Play Audio&#34;, it will open the audio
                                    player and start playing the audio of that line.
                                </Typography>
                                <img src={audioplayerDesktop_img} width="100%" />
                                To keep track of the line it is playing, it will highlight that line purple. You can do
                                the following with the audio player:
                                <ol>
                                    <li>Close it by clicking the &#9587; button</li>
                                    <li>Download the audio by clicking the download button</li>
                                    <li>Jump forward/backward one line</li>
                                    <li>Play, pause, mute, seek</li>
                                </ol>
                                Important things to note
                                <ol>
                                    <li>
                                        If you spam the forward/backward button, the server will throttle you. If you do
                                        spam it, just give it a couple of seconds for the throttle to reset.
                                    </li>
                                    <li>The audio will automatically stop when you go to another page or streamer</li>
                                    <li>If the audio fails to load, it will not show anything</li>
                                </ol>
                            </AccordionDetails>
                        </Accordion>

                        {/* Clipping */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Clipping</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                Clipping allows you to generate a media clip that spans multiple lines in the
                                transcript. The benefits with using this instead of downloading each line separately is
                                <ul>
                                    <li>Significantly faster since you do not have to combine them manually</li>
                                    <li>No artifacts or missed media between lines due to encoding issues</li>
                                    <li>Clearly see what you are clipping</li>
                                </ul>
                                The type of clipping (m4a, mp4, or disabled) is determined by the server on what the
                                server is storing. Depending on this, you will be able to see &#34;download m4a&#34;,
                                &#34;download mp4&#34;, or nothing at all. The type of clipping can be changed when
                                needed.
                                <Typography variant="body1" gutterBottom />
                                <Typography variant="body1" gutterBottom>
                                    To start clipping, click on the triple dots on the line you want to clip; and select
                                    &#34;Start Clip&#34;. This will do the following:
                                </Typography>
                                <ul>
                                    <li>
                                        Mark that line as one of the ends of the clip (either start or finish depending
                                        on the next id you pick)
                                    </li>
                                    <li>
                                        Highlight all triple dots next to it in orange to depict the range of the clip.
                                        Clips are limited in how large they can get.
                                    </li>
                                    <li>Any lines that will be in the clip will now be highlighted in purple.</li>
                                </ul>
                                <img src={clippingStarted_img} width="100%" />
                                To mark the second end of the clip, click on one of the orange triple dots and click
                                &#34;Process Clip&#34;.
                                <img src={clippingMenuDownload_img} width="100%" />
                                <Typography variant="caption">
                                    Caption: as you can see, the lines between 631 (the id I started with) and 634 (the
                                    id I just clicked on) is highlight. This visually shows you what lines will be
                                    included in the clip.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    When you click on the process button, a popup will appear. From here, give the clip
                                    a name and click download to finish the clipping process.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Depending on what media type the server is storing, you will be able to download
                                    m4a, mp4, or nothing.
                                </Typography>
                                <img src={clippingPopup_img} width="100%" />
                                Important notes:
                                <ul>
                                    <li>At any point, you can click Reset Clip to get out of the clipping process</li>
                                    <li>
                                        If one of the lines in a clip does not have any media (either it did not get
                                        saved or it was deleted), then the whole clip will get rejected and you will
                                        land on a Sever Error page.
                                    </li>
                                    <li>You cannot clip a single line. Just download the line audio instead</li>
                                    <li>
                                        There is a limit to how many lines can go into a single clip. If you really want
                                        to increase the limit, just DM me and I will make the change.
                                    </li>
                                </ul>
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
                                <img src={tagMenu_img} width="100%" />
                                <Typography variant="body1" gutterBottom>
                                    This is the tagging alignment menu. It takes the discord message ID of your tag, and
                                    calculates the offset you need for it to align with the beginning of the segment you
                                    selected.
                                </Typography>
                                If you do not know how to get the message ID of your tag:
                                <ol>
                                    <li>
                                        Enable developer mode. Settings {"->"} Advanced {"->"} Enable developer mode
                                    </li>
                                    <li>Right-click on your message and click Copy Message ID</li>
                                </ol>
                                <img src={messageId_img} />
                                <Typography variant="body1" gutterBottom>
                                    The default offset is whatever your server&#39;s tagger bot is set to. For DPS, it
                                    is -20. This value is also stored in the cookie, so you will only have to change it
                                    once.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Once both values are set, it will display the adjust command to run. As well as
                                    enable the button Copy Command to copy the command to your clipboard.
                                </Typography>
                                <img src={filledOutTagMenu_img} width="100%" />
                                <br />
                                Note:
                                <ol>
                                    <li>
                                        As said above, this will time the tag to the beginning of the section you
                                        clicked. Meaning, that if an entire line is one section, then it will time it to
                                        go at the beginning of that line. The only way to make it start in the middle of
                                        a section is to guess how long a section is and change the offset accordingly.
                                    </li>
                                    <li>
                                        The timings seem to be very accurate. When you want to start at the beginning of
                                        the section, it might be best to move it back by one second to give the YT
                                        player time to start the video/audio. Though this should be determined after
                                        testing it out for a few streams.
                                    </li>
                                </ol>
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
