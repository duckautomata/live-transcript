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
    Paper,
    Switch,
    Typography,
    useMediaQuery,
} from "@mui/material";

// Light images
import settings_light from "../assets/helpguide/settings-light.png";
import wordCount_light from "../assets/helpguide/word-count-light.png";
import transcript_light from "../assets/helpguide/transcript-light.png";
import linemenu_light from "../assets/helpguide/linemenu-example-light.png";
import audioplayerDesktop_light from "../assets/helpguide/audioplayer-desktop-light.png";
import tagHighlightText_light from "../assets/helpguide/tag-highlihgt-text-light.png";
import tagMenu_light from "../assets/helpguide/tag-menu-light.png";
import messageId_light from "../assets/helpguide/message-ID-light.png";
import filledOutTagMenu_light from "../assets/helpguide/filled-out-tag-menu-light.png";
import sidebar_light from "../assets/helpguide/sidebar-light.png";
import clippingStarted_light from "../assets/helpguide/clipping-started-light.png";
import clippingMenuDownload_light from "../assets/helpguide/clipping-menu-light.png";
import clippingPopup_light from "../assets/helpguide/clipping-popup-light.png";
import devtoolsControls_light from "../assets/helpguide/devtools-controls-light.png";
import devtoolsPerformance_light from "../assets/helpguide/devtools-performance-light.png";
import formatterDisableGroup_light from "../assets/helpguide/formatter-disable-group-light.png";
import formatterEditingChapter_light from "../assets/helpguide/formatter-editing-chapter-light.png";
import formatterEditingTag_light from "../assets/helpguide/formatter-editing-tag-light.png";
import formatterEnableDisable_light from "../assets/helpguide/formatter-enabledisable-light.png";
import formatterFormatButton_light from "../assets/helpguide/formatter-format-button-light.png";
import formatterFormatButtonExtra_light from "../assets/helpguide/formatter-format-button-extra-light.png";
import formatterFormatView_light from "../assets/helpguide/formatter-format-view-light.png";
import formatterHeaderEdit_light from "../assets/helpguide/formatter-header-edit-light.png";
import formatterHighlightExample_light from "../assets/helpguide/formatter-highlight-example-light.png";
import formatterHighlightExampleFix_light from "../assets/helpguide/formatter-highlight-example-fix-light.png";
import formatterHighlightMenu_light from "../assets/helpguide/formatter-highlight-menu-light.png";
import formatterInputBlank_light from "../assets/helpguide/formatter-input-blank-light.png";
import formatterOffset_light from "../assets/helpguide/formatter-offset-light.png";
import formatterWordEdit_light from "../assets/helpguide/formatter-wordedit-light.png";

// Dark images
import settings_dark from "../assets/helpguide/settings-dark.png";
import wordCount_dark from "../assets/helpguide/word-count-dark.png";
import transcript_dark from "../assets/helpguide/transcript-dark.png";
import linemenu_dark from "../assets/helpguide/linemenu-example-dark.png";
import audioplayerDesktop_dark from "../assets/helpguide/audioplayer-desktop-dark.png";
import tagHighlightText_dark from "../assets/helpguide/tag-highlihgt-text-dark.png";
import tagMenu_dark from "../assets/helpguide/tag-menu-dark.png";
import messageId_dark from "../assets/helpguide/message-ID-dark.png";
import filledOutTagMenu_dark from "../assets/helpguide/filled-out-tag-menu-dark.png";
import sidebar_dark from "../assets/helpguide/sidebar-dark.png";
import clippingStarted_dark from "../assets/helpguide/clipping-started-dark.png";
import clippingMenuDownload_dark from "../assets/helpguide/clipping-menu-dark.png";
import clippingPopup_dark from "../assets/helpguide/clipping-popup-dark.png";
import devtoolsControls_dark from "../assets/helpguide/devtools-controls-dark.png";
import devtoolsPerformance_dark from "../assets/helpguide/devtools-performance-dark.png";
import formatterDisableGroup_dark from "../assets/helpguide/formatter-disable-group-dark.png";
import formatterEditingChapter_dark from "../assets/helpguide/formatter-editing-chapter-dark.png";
import formatterEditingTag_dark from "../assets/helpguide/formatter-editing-tag-dark.png";
import formatterEnableDisable_dark from "../assets/helpguide/formatter-enabledisable-dark.png";
import formatterFormatButton_dark from "../assets/helpguide/formatter-format-button-dark.png";
import formatterFormatButtonExtra_dark from "../assets/helpguide/formatter-format-button-extra-dark.png";
import formatterFormatView_dark from "../assets/helpguide/formatter-format-view-dark.png";
import formatterHeaderEdit_dark from "../assets/helpguide/formatter-header-edit-dark.png";
import formatterHighlightExample_dark from "../assets/helpguide/formatter-highlight-example-dark.png";
import formatterHighlightExampleFix_dark from "../assets/helpguide/formatter-highlight-example-fix-dark.png";
import formatterHighlightMenu_dark from "../assets/helpguide/formatter-highlight-menu-dark.png";
import formatterInputBlank_dark from "../assets/helpguide/formatter-input-blank-dark.png";
import formatterOffset_dark from "../assets/helpguide/formatter-offset-dark.png";
import formatterWordEdit_dark from "../assets/helpguide/formatter-wordedit-dark.png";

import { ExpandMore } from "@mui/icons-material";
import { useAppStore } from "../store/store";

/**
 * Helper component to display guide images with a Paper background.
 */
const HelpImage = ({ src, width = "100%", alt = "" }) => (
    <Paper
        elevation={6}
        sx={{
            my: 2,
            p: 0.5,
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            width: "fit-content",
            maxWidth: "100%",
            mx: "auto",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}
    >
        <img
            src={src}
            alt={alt}
            style={{
                width: width,
                maxWidth: "100%",
                height: "auto",
                display: "block",
                margin: "0 auto",
            }}
        />
    </Paper>
);

/**
 * A dialog displaying help information and guides for the application.
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {function(boolean): void} props.setOpen - Callback to change the open state.
 */
export default function HelpPopup({ open, setOpen }) {
    const theme = useAppStore((state) => state.theme);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const isDarkMode = theme === "dark" || (theme === "system" && prefersDarkMode);
    const enableTagHelper = useAppStore((state) => state.enableTagHelper);
    const setEnableTagHelper = useAppStore((state) => state.setEnableTagHelper);

    const images = {
        settings: isDarkMode ? settings_dark : settings_light,
        wordCount: isDarkMode ? wordCount_dark : wordCount_light,
        transcript: isDarkMode ? transcript_dark : transcript_light,
        linemenu: isDarkMode ? linemenu_dark : linemenu_light,
        audioplayerDesktop: isDarkMode ? audioplayerDesktop_dark : audioplayerDesktop_light,
        tagHighlightText: isDarkMode ? tagHighlightText_dark : tagHighlightText_light,
        tagMenu: isDarkMode ? tagMenu_dark : tagMenu_light,
        messageId: isDarkMode ? messageId_dark : messageId_light,
        filledOutTagMenu: isDarkMode ? filledOutTagMenu_dark : filledOutTagMenu_light,
        sidebar: isDarkMode ? sidebar_dark : sidebar_light,
        clippingStarted: isDarkMode ? clippingStarted_dark : clippingStarted_light,
        clippingMenuDownload: isDarkMode ? clippingMenuDownload_dark : clippingMenuDownload_light,
        clippingPopup: isDarkMode ? clippingPopup_dark : clippingPopup_light,
        devtoolsControls: isDarkMode ? devtoolsControls_dark : devtoolsControls_light,
        devtoolsPerformance: isDarkMode ? devtoolsPerformance_dark : devtoolsPerformance_light,
        formatterDisableGroup: isDarkMode ? formatterDisableGroup_dark : formatterDisableGroup_light,
        formatterEditingChapter: isDarkMode ? formatterEditingChapter_dark : formatterEditingChapter_light,
        formatterEditingTag: isDarkMode ? formatterEditingTag_dark : formatterEditingTag_light,
        formatterEnableDisable: isDarkMode ? formatterEnableDisable_dark : formatterEnableDisable_light,
        formatterFormatButton: isDarkMode ? formatterFormatButton_dark : formatterFormatButton_light,
        formatterFormatButtonExtra: isDarkMode ? formatterFormatButtonExtra_dark : formatterFormatButtonExtra_light,
        formatterFormatView: isDarkMode ? formatterFormatView_dark : formatterFormatView_light,
        formatterHeaderEdit: isDarkMode ? formatterHeaderEdit_dark : formatterHeaderEdit_light,
        formatterHighlightExample: isDarkMode ? formatterHighlightExample_dark : formatterHighlightExample_light,
        formatterHighlightExampleFix: isDarkMode
            ? formatterHighlightExampleFix_dark
            : formatterHighlightExampleFix_light,
        formatterHighlightMenu: isDarkMode ? formatterHighlightMenu_dark : formatterHighlightMenu_light,
        formatterInputBlank: isDarkMode ? formatterInputBlank_dark : formatterInputBlank_light,
        formatterOffset: isDarkMode ? formatterOffset_dark : formatterOffset_light,
        formatterWordEdit: isDarkMode ? formatterWordEdit_dark : formatterWordEdit_light,
    };

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
                                <HelpImage src={images.settings} width="75%" />
                                <Typography variant="body1" gutterBottom>
                                    There are currently 6 settings. All settings are stored in a cookie and persist
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
                                        Transcript Height: How tall should the transcript be.
                                        <blockquote>
                                            100% means it will go all the way to the bottom of the page. Select a
                                            smaller value if you want the bottom to be higher up on the page.
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
                                        Developer Mode
                                        <blockquote>
                                            Enables technical details for debugging, such as the Live Timer and server
                                            status metrics.
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
                                <HelpImage src={images.sidebar} width="50%" />
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
                                    The transcript viewer allows you to review what was said during the stream. This
                                    updates in real time, so there is no need to refresh.
                                </Typography>
                                <Typography variant="body1" color="error" gutterBottom>
                                    NOTE: The transcripts are not guaranteed to be accurate to what was said on stream,
                                    or if the streamer said it, or it was said in game or by someone else.
                                </Typography>
                                <HelpImage src={images.transcript} />
                                There are 4 parts to the transcript page.
                                <ol>
                                    <li>The title</li>
                                    <li>The search bar</li>
                                    <li>The transcript</li>
                                    <li>The live/pause/jump menu</li>
                                </ol>
                                The transcript is broken up into 3 parts.
                                <ol>
                                    <li>Options (three dots in green)</li>
                                    <li>The timestamp</li>
                                    <li>The text</li>
                                </ol>
                                Clicking on the options button will open a menu. This is where you can
                                <ul>
                                    <li>Start a clip (explained more in the Clipping section)</li>
                                    <li>Play or download the audio</li>
                                    <li>Open the stream to this spot if DVR or Vod is available</li>
                                    <li>Copy the unix timestamp of when the line starts</li>
                                </ul>
                                <HelpImage src={images.linemenu} />
                                <Typography variant="h6" gutterBottom>
                                    Live vs Paused vs Offline
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    <strong>Live:</strong> The transcript auto-scrolls to show the newest messages.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    <strong>Paused:</strong> Auto-scroll stops. This happens automatically when you
                                    scroll up, jump to the top, or use the search bar.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    <strong>Offline:</strong> Same as Paused, but is forced when the stream goes
                                    offline. This means you can&apos;t go to live mode since there is no stream to
                                    scroll to.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    To resume Live mode, scroll to the bottom, click the play button, or the &quot;Jump
                                    to Bottom&quot; arrow. If you are searching, you will need to click
                                    &quot;Searching&quot; or clear the search bar and go to the bottom.
                                </Typography>
                                <br />
                                <Typography variant="h6" gutterBottom>
                                    Log Height
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    You can adjust how much of the screen the transcript takes up in the Settings menu
                                    (Full, 90%, 75%, 50%).
                                </Typography>
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
                                    When you click on a line id and select &quot;Play Audio&quot;, it will open the
                                    audio player and start playing the audio of that line.
                                </Typography>
                                <HelpImage src={images.audioplayerDesktop} />
                                To keep track of the line it is playing, it will highlight that line in purple. You can
                                do the following with the audio player:
                                <ol>
                                    <li>Close it by clicking the &quot;X&quot; button</li>
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
                                server is storing. Depending on this, you will be able to see &quot;download m4a&quot;,
                                &quot;download mp4&quot;, or nothing at all. The type of clipping can be changed when
                                needed.
                                <Typography variant="body1" gutterBottom />
                                <Typography variant="body1" gutterBottom>
                                    To start clipping, click on the triple dots on the line you want to clip; and select
                                    &quot;Start Clip&quot;. This will do the following:
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
                                <HelpImage src={images.clippingStarted} />
                                To mark the second end of the clip, click on one of the orange triple dots and click
                                &quot;Process Clip&quot;.
                                <HelpImage src={images.clippingMenuDownload} />
                                <Typography variant="caption">
                                    Caption: as you can see, the lines between 631 (the id I started with) and 634 (the
                                    id I just clicked on) are highlighted. This visually shows you what lines will be
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
                                <HelpImage src={images.clippingPopup} />
                                Important notes:
                                <ul>
                                    <li>At any point, you can click Reset Clip to get out of the clipping process</li>
                                    <li>
                                        If one of the lines in a clip does not have any media (either it did not get
                                        saved or it was deleted), then the whole clip will get rejected and you will
                                        land on a Server Error page.
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
                                <HelpImage src={images.wordCount} />
                                <Typography variant="body1" gutterBottom>
                                    The only requirement is that the word is 3 or more characters long.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    To view the graph value, either hover over it with your mouse if you are on PC, or
                                    tap/drag on the graph if you are on mobile.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        {/* Tag Formatter */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Tag Formatter</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="h6" gutterBottom>
                                    Input View
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    The tag formatter allows you to format, organize, edit, and delete tags. Everything
                                    is saved locally and is unique to each streamer.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    To use it, click on the tag formatter button in the top right corner of the page.
                                </Typography>
                                <HelpImage src={images.formatterInputBlank} />
                                <Typography variant="body1" gutterBottom>
                                    When you first open the tag formatter, you will see an empty input field. Paste the
                                    tags and press &quot;Format Tags&quot;, or click &quot;Format From Clipboard&quot;
                                    to automatically use the tags from your clipboard.
                                </Typography>
                                <HelpImage src={images.formatterFormatButton} />
                                <Typography variant="body1" gutterBottom>
                                    If you go back to this page after formatting, you will be given the option to reset
                                    data, reformat, or go back to the format view.
                                </Typography>
                                <HelpImage src={images.formatterFormatButtonExtra} />

                                <Typography variant="h6" gutterBottom>
                                    Format View
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    After clicking format, you go to the format view. Here you will see a list of tags,
                                    a list of headers, and a section to bulk edit tags.
                                </Typography>
                                <HelpImage src={images.formatterFormatView} />
                                <Typography variant="body1" gutterBottom>
                                    The Headers section is a list of groups, chapters, and birthday group, in order they
                                    appear in the formatted tags. Here you can:
                                </Typography>
                                <ul>
                                    <li>Click on a header to jump to its position in the tags.</li>
                                    <li>
                                        Click on the checkbox to enable/disable a header. Disabling a group will put its
                                        tags back to the original spot. Disabling a chapter will just remove the chapter
                                        header.
                                    </li>
                                    <li>Organize a group by moving it up or down by clicking on the arrows.</li>
                                </ul>
                                <HelpImage src={images.formatterHeaderEdit} />
                                <Typography variant="body1" gutterBottom>
                                    The Tags section shows what the output will look like. Here you can:
                                </Typography>
                                <ul>
                                    <li>Enable or disable a tag. Disabling a tag will remove it from the output.</li>
                                    <li>
                                        Edit a tag or header by clicking on the edit button. Tags and chapters can also
                                        edit the timestamp.
                                    </li>
                                </ul>
                                <HelpImage src={images.formatterEditingTag} />
                                <HelpImage src={images.formatterEditingChapter} />
                                <Typography variant="body1" gutterBottom>
                                    If you disable all tags in a header, it will disable the header and remove it from
                                    the output.
                                </Typography>
                                <HelpImage src={images.formatterDisableGroup} />
                                <Typography variant="body1" gutterBottom>
                                    The Bulk Edit section allows you to edit multiple tags at once. There are currently
                                    4 actions you can perform:
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    1. Offset Timestamps: enter the start and end timestamp, and the offset, in the
                                    format hh:mm:ss. Click on the plus to add the offset to all tags in the range. Click
                                    on the minus to subtract the offset from all tags in the range.
                                </Typography>
                                <HelpImage src={images.formatterOffset} />
                                <Typography variant="body1" gutterBottom>
                                    2. Enable and Disable Tags: enter the start and end timestamp in the format
                                    hh:mm:ss. Click on enable or disable to enable or disable all tags in the range.
                                </Typography>
                                <HelpImage src={images.formatterEnableDisable} />
                                <Typography variant="body1" gutterBottom>
                                    3. Word Edit: enter a word to find and replace it with another word. Clicking on
                                    replace all will replace all instances of the word with the replace word.
                                </Typography>
                                <HelpImage src={images.formatterWordEdit} />
                                <Typography variant="body1" gutterBottom>
                                    4. Highlight Timestamps: enableing this will highlight all tags that are too close
                                    to each other. The seconds value defines how close they can be. This is useful for
                                    finding tags that could be duplicates.
                                </Typography>
                                <HelpImage src={images.formatterHighlightMenu} />
                                <Typography variant="body1" gutterBottom>
                                    When highlight is turned on, any close tags will be highlighted in yellow.
                                </Typography>
                                <HelpImage src={images.formatterHighlightExample} />
                                <Typography variant="body1" gutterBottom>
                                    Disabling one of the close tags will remove the highlight (assuming there are no
                                    other close tags to it).
                                </Typography>
                                <HelpImage src={images.formatterHighlightExampleFix} />
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
                                    The tagging feature allows you to time a tag to a specific point in the transcript.
                                    This feature is disabled by default - enable it by toggling the switch below. You
                                    can also enable/disable it in the settings.
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mt: 1,
                                    }}
                                >
                                    <Typography variant="body1" sx={{ fontWeight: "bold" }} gutterBottom>
                                        Tagging Feature: {enableTagHelper ? "Enabled" : "Disabled"}
                                    </Typography>
                                    <Switch
                                        checked={enableTagHelper}
                                        onChange={(e) => setEnableTagHelper(e.target.checked)}
                                        name="enableTagHelper"
                                    />
                                </Box>
                                <Typography variant="body1" gutterBottom>
                                    Once enabled, you will be able to hover over the text in the transcript and click
                                    specific sections (denoted by the colored box that appears).
                                </Typography>
                                <HelpImage src={images.tagHighlightText} />
                                <Typography variant="body1" gutterBottom>
                                    These sections denote a specific part where you can set the tag to (the tags will be
                                    set to the beginning of the section. For example, using the image above, the tag
                                    will be set to the word &quot;Oh&quot;).
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Once you find the section you want to time a tag to; click it and a menu will
                                    appear.
                                </Typography>
                                <HelpImage src={images.tagMenu} />
                                <Typography variant="body1" gutterBottom>
                                    This is the tagging alignment menu. It takes the discord message ID of your tag, and
                                    calculates the offset you need for it to align with the beginning of the section you
                                    selected.
                                </Typography>
                                If you do not know how to get the message ID of your tag:
                                <ol>
                                    <li>
                                        Enable <strong>Discord</strong> developer mode. User Settings {"->"} Advanced{" "}
                                        {"->"} Enable Developer Mode
                                    </li>
                                    <li>Right-click on your message and click Copy Message ID</li>
                                </ol>
                                <HelpImage src={images.messageId} width="auto" />
                                <Typography variant="body1" gutterBottom>
                                    The default offset is whatever your server&#39;s tagger bot is set to. For DPS, it
                                    is -20. This value is also stored in local storage, so you will only have to change
                                    it once.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Once both values are set, it will display the adjust command to run. As well as
                                    enable the button Copy Command to copy the command to your clipboard.
                                </Typography>
                                <HelpImage src={images.filledOutTagMenu} />
                                <Typography variant="body1" gutterBottom>
                                    Using the image above, after pasting the command into discord, the tag will be timed
                                    exactly to &quot;Gotta&quot;. If maybe a half second before it (we floor the
                                    timestamps).
                                </Typography>
                                <br />
                                Note:
                                <ol>
                                    <li>
                                        As said above, this will time the tag to the beginning of the section you
                                        clicked. This means that if an entire line is one section, it will time it to go
                                        at the beginning of that line. The only way to make it start in the middle of a
                                        section is to guess how long a section is and change the offset accordingly.
                                    </li>
                                    <li>
                                        The timings are perfect. Because of this, you might want to move the tag back by
                                        one second to give the YT player time to start the video/audio. But from my
                                        testing, it&apos;s not necessary.
                                    </li>
                                </ol>
                            </AccordionDetails>
                        </Accordion>

                        {/* Developer Mode */}
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Developer Mode</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" gutterBottom>
                                    Developer Mode enables technical details primarily used for debugging and
                                    performance monitoring.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    To open the Dev Tools, enable Developer Mode in Settings and click on the Dev Tools
                                    icon that appears below the Tag Fixer icon and above the GitHub icon.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    In the Dev Tools, there are two pages:
                                </Typography>
                                <ul>
                                    <li>
                                        <strong>Controls:</strong> Allows you to control the transcripts and simulate
                                        live streams to help debug.
                                    </li>
                                    <li>
                                        <strong>Performance:</strong> Detailed performance metrics used to show if there
                                        are any network or processing issues.
                                    </li>
                                </ul>
                                <Typography variant="h6" gutterBottom>
                                    <strong>Controls</strong>
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Broken up into 5 tabs:
                                    <ul>
                                        <li>
                                            <strong>Clear Transcript:</strong> Deletes all transcript data for the key
                                            you are on.
                                        </li>
                                        <li>
                                            <strong>Stream State:</strong> Allows you to change the stream data such as
                                            title, start time, media type, and live status.
                                        </li>
                                        <li>
                                            <strong>Add Line:</strong> Allows you to add a line to the transcript.
                                        </li>
                                        <li>
                                            <strong>Simulation:</strong> Allows you to repeatedly add lines to the
                                            transcript every interval.
                                        </li>
                                        <li>
                                            <strong>Delete Line:</strong> Allows you to delete a specific line from the
                                            transcript.
                                        </li>
                                    </ul>
                                </Typography>
                                <HelpImage src={images.devtoolsControls} />
                                <Typography variant="h6" gutterBottom>
                                    <strong>Performance</strong>
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Broken up into 4 tabs:
                                    <ul>
                                        <li>
                                            <strong>Metrics:</strong> Shows the metrics of the website and the current
                                            stream.
                                        </li>
                                        <li>
                                            <strong>Server Upload Time (s):</strong> Graph of the time it takes to
                                            upload to the server.
                                        </li>
                                        <li>
                                            <strong>Server-Client Latency (s):</strong> Graph of the latency between
                                            when the server received the message and when the client received the
                                            message.
                                        </li>
                                        <li>
                                            <strong>Message Inter-arrival Time (s):</strong> Graph of the time between
                                            when a message was received and when the next message was received.
                                        </li>
                                    </ul>
                                </Typography>
                                <HelpImage src={images.devtoolsPerformance} />
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
