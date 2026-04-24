import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Paper,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { ExpandMore, Highlight, ManageSearch, Schedule, ToggleOn } from "@mui/icons-material";

const sectionAccordionSx = {
    "&:before": { display: "none" },
    borderBottom: 2,
    borderColor: "divider",
    "&:last-of-type": { borderBottom: 0 },
};

const summarySx = {
    px: 2,
    minHeight: 44,
    bgcolor: "action.hover",
    "&:hover": { bgcolor: "action.selected" },
    "&.Mui-expanded": {
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
    },
    "& .MuiAccordionSummary-content": { my: 1, alignItems: "center", gap: 1 },
    "& .MuiAccordionSummary-content.Mui-expanded": { my: 1 },
};

const detailsSx = { px: 2, pb: 2, pt: 1.5 };

const SectionTitle = ({ icon, children }) => (
    <>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {children}
        </Typography>
    </>
);

const CountBadge = ({ count, bgcolor, theme, testId }) => (
    <Box
        data-testid={testId}
        sx={{
            display: "inline-block",
            minWidth: 68,
            textAlign: "center",
            bgcolor,
            color: theme.palette.getContrastText(bgcolor),
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: "0.72rem",
            fontWeight: "bold",
            flexShrink: 0,
        }}
    >
        {count} found
    </Box>
);

const HighlightRow = ({ checked, onChange, testId, children, count, bgcolor, theme, countTestId }) => (
    <Box sx={{ display: "flex", alignItems: "center", py: 0.25, minHeight: 36 }}>
        <Switch checked={checked} onChange={onChange} size="small" sx={{ mr: 1 }} data-testid={testId} />
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, minWidth: 0 }}>{children}</Box>
        <Box sx={{ width: 76, textAlign: "right", flexShrink: 0 }}>
            {checked && <CountBadge count={count} bgcolor={bgcolor} theme={theme} testId={countTestId} />}
        </Box>
    </Box>
);

export const BulkEditPanel = ({
    bulkEdit,
    handleBulkEditChange,
    applyOffset,
    applyEnableDisable,
    applyFindReplace,
    highlightStats,
    theme,
    isMobile = false,
}) => (
    <Paper
        elevation={3}
        sx={{
            height: "100%",
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        }}
    >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
            <Typography variant="h6">Bulk Edit</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>
            {/* Offset Timestamps */}
            <Accordion disableGutters elevation={0} square sx={sectionAccordionSx}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={summarySx}>
                    <SectionTitle icon={<Schedule fontSize="small" color="action" />}>Offset Timestamps</SectionTitle>
                </AccordionSummary>
                <AccordionDetails sx={detailsSx}>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                        <TextField
                            label="Start"
                            size="small"
                            placeholder="00:00"
                            data-testid="tag-offset-start"
                            value={bulkEdit.offsetStart}
                            onChange={(e) => handleBulkEditChange("offsetStart", e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="End"
                            size="small"
                            placeholder="01:00"
                            data-testid="tag-offset-end"
                            value={bulkEdit.offsetEnd}
                            onChange={(e) => handleBulkEditChange("offsetEnd", e.target.value)}
                            fullWidth
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            label="Offset"
                            size="small"
                            placeholder="00:05"
                            data-testid="tag-offset-amount"
                            value={bulkEdit.offsetAmount}
                            onChange={(e) => handleBulkEditChange("offsetAmount", e.target.value)}
                            sx={{ flexGrow: 1 }}
                        />
                        <Tooltip title="Add offset to timestamps in range">
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => applyOffset(1)}
                                data-testid="tag-offset-add"
                                sx={{ minWidth: 40 }}
                            >
                                +
                            </Button>
                        </Tooltip>
                        <Tooltip title="Subtract offset from timestamps in range">
                            <Button
                                variant="contained"
                                size="small"
                                color="warning"
                                onClick={() => applyOffset(-1)}
                                data-testid="tag-offset-subtract"
                                sx={{ minWidth: 40 }}
                            >
                                −
                            </Button>
                        </Tooltip>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Enable/Disable Range */}
            <Accordion disableGutters elevation={0} square sx={sectionAccordionSx}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={summarySx}>
                    <SectionTitle icon={<ToggleOn fontSize="small" color="action" />}>
                        Enable / Disable Range
                    </SectionTitle>
                </AccordionSummary>
                <AccordionDetails sx={detailsSx}>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                        <TextField
                            label="Start"
                            size="small"
                            placeholder="00:00"
                            data-testid="tag-enable-start"
                            value={bulkEdit.enableStart}
                            onChange={(e) => handleBulkEditChange("enableStart", e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="End"
                            size="small"
                            placeholder="01:00"
                            data-testid="tag-enable-end"
                            value={bulkEdit.enableEnd}
                            onChange={(e) => handleBulkEditChange("enableEnd", e.target.value)}
                            fullWidth
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={() => applyEnableDisable(true)}
                            data-testid="tag-enable-btn"
                        >
                            Enable
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            color="error"
                            onClick={() => applyEnableDisable(false)}
                            data-testid="tag-disable-btn"
                        >
                            Disable
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Find & Replace */}
            <Accordion disableGutters elevation={0} square sx={sectionAccordionSx}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={summarySx}>
                    <SectionTitle icon={<ManageSearch fontSize="small" color="action" />}>
                        Find &amp; Replace
                    </SectionTitle>
                </AccordionSummary>
                <AccordionDetails sx={detailsSx}>
                    <TextField
                        label="Find"
                        size="small"
                        fullWidth
                        sx={{ mb: 1 }}
                        data-testid="tag-find-text"
                        value={bulkEdit.findText}
                        onChange={(e) => handleBulkEditChange("findText", e.target.value)}
                    />
                    <TextField
                        label="Replace with"
                        size="small"
                        fullWidth
                        sx={{ mb: 1 }}
                        data-testid="tag-replace-text"
                        value={bulkEdit.replaceText}
                        onChange={(e) => handleBulkEditChange("replaceText", e.target.value)}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={applyFindReplace}
                        data-testid="tag-replace-all-btn"
                    >
                        Replace All
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Highlight */}
            <Accordion defaultExpanded={!isMobile} disableGutters elevation={0} square sx={sectionAccordionSx}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={summarySx}>
                    <SectionTitle icon={<Highlight fontSize="small" color="action" />}>
                        Highlight tags that…
                    </SectionTitle>
                </AccordionSummary>
                <AccordionDetails sx={detailsSx}>
                    {/* Time Delta */}
                    <Box sx={{ display: "flex", alignItems: "center", py: 0.25, minHeight: 36, minWidth: 0 }}>
                        <Switch
                            checked={bulkEdit.isHighlightTime}
                            onChange={(e) => handleBulkEditChange("isHighlightTime", e.target.checked)}
                            size="small"
                            sx={{ mr: 1, flexShrink: 0 }}
                            data-testid="tag-highlight-time"
                        />
                        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ mr: 0.5 }}>
                                are under
                            </Typography>
                            <TextField
                                size="small"
                                variant="standard"
                                value={bulkEdit.highlightThreshold}
                                onChange={(e) => handleBulkEditChange("highlightThreshold", e.target.value)}
                                disabled={!bulkEdit.isHighlightTime}
                                sx={{ width: "40px", mr: 0.5, "& input": { textAlign: "center" } }}
                                data-testid="tag-highlight-time-threshold"
                            />
                            <Typography variant="body2">seconds apart</Typography>
                        </Box>
                        <Box sx={{ width: 76, textAlign: "right", flexShrink: 0 }}>
                            {bulkEdit.isHighlightTime && (
                                <CountBadge
                                    count={highlightStats.countTime}
                                    bgcolor={theme.palette.background.yellow}
                                    theme={theme}
                                    testId="tag-highlight-time-count"
                                />
                            )}
                        </Box>
                    </Box>

                    {/* Censored */}
                    <HighlightRow
                        checked={bulkEdit.isHighlightCensored}
                        onChange={(e) => handleBulkEditChange("isHighlightCensored", e.target.checked)}
                        testId="tag-highlight-censored"
                        count={highlightStats.countCensored}
                        bgcolor={theme.palette.background.orange}
                        theme={theme}
                        countTestId="tag-highlight-censored-count"
                    >
                        <Typography variant="body2">are censored / filtered</Typography>
                    </HighlightRow>

                    {/* Contains * */}
                    <HighlightRow
                        checked={bulkEdit.isHighlightStar}
                        onChange={(e) => handleBulkEditChange("isHighlightStar", e.target.checked)}
                        testId="tag-highlight-star"
                        count={highlightStats.countStar}
                        bgcolor={theme.palette.background.red}
                        theme={theme}
                        countTestId="tag-highlight-star-count"
                    >
                        <Typography variant="body2">contain a *</Typography>
                    </HighlightRow>

                    {/* All Caps */}
                    <HighlightRow
                        checked={bulkEdit.isHighlightCaps}
                        onChange={(e) => handleBulkEditChange("isHighlightCaps", e.target.checked)}
                        testId="tag-highlight-caps"
                        count={highlightStats.countCaps}
                        bgcolor={theme.palette.background.teal}
                        theme={theme}
                        countTestId="tag-highlight-caps-count"
                    >
                        <Typography variant="body2">are ALL CAPS</Typography>
                    </HighlightRow>
                </AccordionDetails>
            </Accordion>
        </Box>
    </Paper>
);
