import { Box, Checkbox, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { orange } from "@mui/material/colors";
import { ArrowDownward, ArrowUpward, Cake, Collections, Inbox, MenuBook } from "@mui/icons-material";
import { timeToSeconds } from "../../logic/tagHelpers";

const SectionHeader = ({ icon, label, count }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            mt: 1.5,
            mb: 0.5,
            color: "text.secondary",
            "&:first-of-type": { mt: 0 },
        }}
    >
        {icon}
        <Typography variant="overline" sx={{ fontWeight: 600, lineHeight: 1, letterSpacing: 0.5 }}>
            {label}
        </Typography>
        <Chip size="small" label={count} sx={{ height: 18, "& .MuiChip-label": { px: 1, fontSize: "0.7rem" } }} />
    </Box>
);

const controlRowSx = (isHovered) => ({
    display: "flex",
    alignItems: "center",
    minHeight: 32,
    pr: 0.5,
    borderRadius: 1,
    bgcolor: isHovered ? "action.hover" : "transparent",
    transition: "background-color 0.15s ease",
    "&:hover": { bgcolor: "action.hover" },
});

export const ControlsPanel = ({ controls, formattedRows, hoveredParent, toggleControl, moveControl, scrollToRow }) => {
    const groupHasEnabledChildren = {};
    formattedRows.forEach((row) => {
        if (row.type === "tag" && row.isEnabled && row.parentName) {
            groupHasEnabledChildren[row.parentName] = true;
        }
    });

    const collectionKeys = Object.keys(controls)
        .filter((key) => controls[key].type === "collection")
        .sort((a, b) => (controls[a].order || 0) - (controls[b].order || 0));

    const chapterKeys = Object.keys(controls)
        .filter((key) => controls[key].type === "chapter")
        .sort((a, b) => {
            const rowA = formattedRows.find((r) => r.type === "header" && r.name === a);
            const rowB = formattedRows.find((r) => r.type === "header" && r.name === b);
            const timeA = rowA ? timeToSeconds(rowA.timestamp) : Infinity;
            const timeB = rowB ? timeToSeconds(rowB.timestamp) : Infinity;
            return timeA - timeB;
        });

    const hbdKeys = Object.keys(controls).filter((key) => controls[key].type === "hbd");

    const isEmpty = collectionKeys.length === 0 && chapterKeys.length === 0 && hbdKeys.length === 0;

    return (
        <Paper elevation={3} sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
                <Typography variant="h6">Headers</Typography>
            </Box>

            <Box sx={{ overflowY: "auto", flexGrow: 1, px: 2, py: 1 }}>
                {isEmpty && (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "text.secondary",
                            gap: 0.5,
                            py: 3,
                        }}
                    >
                        <Inbox sx={{ fontSize: 36, opacity: 0.4 }} />
                        <Typography variant="caption">No headers yet</Typography>
                    </Box>
                )}

                {collectionKeys.length > 0 && (
                    <>
                        <SectionHeader
                            icon={<Collections fontSize="small" />}
                            label="Collections"
                            count={collectionKeys.length}
                        />
                        {collectionKeys.map((key, index, array) => {
                            const hasChildren = groupHasEnabledChildren[key];
                            const isCrossedOut = !hasChildren && controls[key].isEnabled;
                            const isHovered = key === hoveredParent;

                            return (
                                <Box
                                    key={key}
                                    data-testid={`tag-control-collection-${key}`}
                                    data-control-enabled={controls[key].isEnabled ? "true" : "false"}
                                    data-control-crossed-out={isCrossedOut ? "true" : "false"}
                                    sx={controlRowSx(isHovered)}
                                >
                                    <Checkbox
                                        checked={controls[key].isEnabled}
                                        onChange={() => toggleControl(key)}
                                        size="small"
                                    />
                                    <Tooltip title="Click to jump to header">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                cursor: "pointer",
                                                fontWeight: "bold",
                                                textDecoration: isCrossedOut ? "line-through" : "none",
                                                opacity: isCrossedOut ? 0.6 : 1,
                                                flexGrow: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            onClick={() => scrollToRow(key)}
                                        >
                                            {key}
                                        </Typography>
                                    </Tooltip>
                                    {index > 0 && (
                                        <Tooltip title="Move up">
                                            <IconButton
                                                size="small"
                                                onClick={() => moveControl(key, -1)}
                                                data-testid={`tag-control-move-up-${key}`}
                                            >
                                                <ArrowUpward fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {index < array.length - 1 && (
                                        <Tooltip title="Move down">
                                            <IconButton
                                                size="small"
                                                onClick={() => moveControl(key, 1)}
                                                data-testid={`tag-control-move-down-${key}`}
                                            >
                                                <ArrowDownward fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            );
                        })}
                    </>
                )}

                {chapterKeys.length > 0 && (
                    <>
                        <SectionHeader
                            icon={<MenuBook fontSize="small" />}
                            label="Chapters"
                            count={chapterKeys.length}
                        />
                        {chapterKeys.map((key) => {
                            const hasChildren = groupHasEnabledChildren[key];
                            const isCrossedOut = !hasChildren && controls[key].isEnabled;
                            const isHovered = key === hoveredParent;

                            return (
                                <Box
                                    key={key}
                                    data-testid={`tag-control-chapter-${key}`}
                                    data-control-enabled={controls[key].isEnabled ? "true" : "false"}
                                    data-control-crossed-out={isCrossedOut ? "true" : "false"}
                                    data-control-hovered={isHovered ? "true" : "false"}
                                    sx={controlRowSx(isHovered)}
                                >
                                    <Checkbox
                                        checked={controls[key].isEnabled}
                                        onChange={() => toggleControl(key)}
                                        size="small"
                                    />
                                    <Tooltip title="Click to jump to chapter">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                cursor: "pointer",
                                                fontWeight: "bold",
                                                color: orange[900],
                                                textDecoration: isCrossedOut ? "line-through" : "none",
                                                opacity: isCrossedOut ? 0.6 : 1,
                                                flexGrow: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            onClick={() => scrollToRow(key)}
                                        >
                                            {key}
                                        </Typography>
                                    </Tooltip>
                                </Box>
                            );
                        })}
                    </>
                )}

                {hbdKeys.length > 0 && (
                    <>
                        <SectionHeader icon={<Cake fontSize="small" />} label="Birthdays" count={hbdKeys.length} />
                        {hbdKeys.map((key) => {
                            const hasChildren = groupHasEnabledChildren[key];
                            const isCrossedOut = !hasChildren && controls[key].isEnabled;

                            return (
                                <Box
                                    key={key}
                                    data-testid={`tag-control-hbd-${key}`}
                                    data-control-enabled={controls[key].isEnabled ? "true" : "false"}
                                    data-control-crossed-out={isCrossedOut ? "true" : "false"}
                                    sx={controlRowSx(false)}
                                >
                                    <Checkbox
                                        checked={controls[key].isEnabled}
                                        disabled
                                        onChange={() => toggleControl(key)}
                                        sx={{ visibility: "hidden" }}
                                        size="small"
                                    />
                                    <Tooltip title="Click to jump to birthdays">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                cursor: "pointer",
                                                fontWeight: "bold",
                                                color: "primary.main",
                                                textDecoration: isCrossedOut ? "line-through" : "none",
                                                opacity: isCrossedOut ? 0.6 : 1,
                                                flexGrow: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            onClick={() => scrollToRow(key)}
                                        >
                                            {key}
                                        </Typography>
                                    </Tooltip>
                                </Box>
                            );
                        })}
                    </>
                )}
            </Box>
        </Paper>
    );
};
