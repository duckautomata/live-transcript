import { Box, Paper, Typography, Checkbox, IconButton } from "@mui/material";
import { orange } from "@mui/material/colors";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { timeToSeconds } from "../../logic/tagHelpers";

export const ControlsPanel = ({ controls, formattedRows, hoveredParent, toggleControl, moveControl, scrollToRow }) => {
    const groupHasEnabledChildren = {};
    formattedRows.forEach((row) => {
        if (row.type === "tag" && row.isEnabled && row.parentName) {
            groupHasEnabledChildren[row.parentName] = true;
        }
    });

    return (
        <Paper
            elevation={3}
            sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1, overflow: "hidden" }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>
                Headers
            </Typography>
            <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
                {/* Collections */}
                {Object.keys(controls)
                    .filter((key) => controls[key].type === "collection")
                    .sort((a, b) => (controls[a].order || 0) - (controls[b].order || 0))
                    .map((key, index, array) => {
                        const hasChildren = groupHasEnabledChildren[key];
                        const isCrossedOut = !hasChildren && controls[key].isEnabled;

                        return (
                            <Box
                                key={key}
                                data-testid={`tag-control-collection-${key}`}
                                data-control-enabled={controls[key].isEnabled ? "true" : "false"}
                                data-control-crossed-out={isCrossedOut ? "true" : "false"}
                                sx={{ display: "flex", alignItems: "center", mb: 1 }}
                            >
                                <Checkbox
                                    checked={controls[key].isEnabled}
                                    onChange={() => toggleControl(key)}
                                    size="small"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        textDecoration: isCrossedOut ? "line-through" : "none",
                                        opacity: isCrossedOut ? 0.6 : 1,
                                    }}
                                    onClick={() => scrollToRow(key)}
                                >
                                    {key}
                                </Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                {index > 0 && (
                                    <IconButton
                                        size="small"
                                        onClick={() => moveControl(key, -1)}
                                        data-testid={`tag-control-move-up-${key}`}
                                    >
                                        <ArrowUpward fontSize="small" />
                                    </IconButton>
                                )}
                                {index < array.length - 1 && (
                                    <IconButton
                                        size="small"
                                        onClick={() => moveControl(key, 1)}
                                        data-testid={`tag-control-move-down-${key}`}
                                    >
                                        <ArrowDownward fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        );
                    })}

                {/* Chapters */}
                {Object.keys(controls)
                    .filter((key) => controls[key].type === "chapter")
                    .sort((a, b) => {
                        const rowA = formattedRows.find((r) => r.type === "header" && r.name === a);
                        const rowB = formattedRows.find((r) => r.type === "header" && r.name === b);

                        const timeA = rowA ? timeToSeconds(rowA.timestamp) : Infinity;
                        const timeB = rowB ? timeToSeconds(rowB.timestamp) : Infinity;

                        return timeA - timeB;
                    })
                    .map((key) => {
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
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1,
                                    bgcolor: isHovered ? "action.hover" : "transparent",
                                    borderRadius: 1,
                                    pr: 1,
                                }}
                            >
                                <Checkbox
                                    checked={controls[key].isEnabled}
                                    onChange={() => toggleControl(key)}
                                    size="small"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        color: orange[900],
                                        textDecoration: isCrossedOut ? "line-through" : "none",
                                        opacity: isCrossedOut ? 0.6 : 1,
                                    }}
                                    onClick={() => scrollToRow(key)}
                                >
                                    {key}
                                </Typography>
                            </Box>
                        );
                    })}

                {/* HBD */}
                {Object.keys(controls)
                    .filter((key) => controls[key].type === "hbd")
                    .map((key) => {
                        const hasChildren = groupHasEnabledChildren[key];
                        const isCrossedOut = !hasChildren && controls[key].isEnabled;

                        return (
                            <Box
                                key={key}
                                data-testid={`tag-control-hbd-${key}`}
                                data-control-enabled={controls[key].isEnabled ? "true" : "false"}
                                data-control-crossed-out={isCrossedOut ? "true" : "false"}
                                sx={{ display: "flex", alignItems: "center", mb: 1 }}
                            >
                                <Checkbox
                                    checked={controls[key].isEnabled}
                                    disabled
                                    onChange={() => toggleControl(key)}
                                    sx={{
                                        visibility: "hidden",
                                    }}
                                    size="small"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        color: "primary.main",
                                        textDecoration: isCrossedOut ? "line-through" : "none",
                                        opacity: isCrossedOut ? 0.6 : 1,
                                    }}
                                    onClick={() => scrollToRow(key)}
                                >
                                    {key}
                                </Typography>
                            </Box>
                        );
                    })}
            </Box>
        </Paper>
    );
};
