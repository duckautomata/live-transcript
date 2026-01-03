import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { useAppStore } from "../../store/store";
import { Tooltip, Box, Typography } from "@mui/material";
import { orange, purple, pink, blue } from "@mui/material/colors";
import { memo } from "react";

const SegmentTheme = styled("span")(({ theme }) => ({
    cursor: "pointer",
    "&:hover": {
        backgroundColor: theme.palette.secondary.background,
    },
}));

/**
 * A single segment of text within a transcript line.
 * @param {object} props
 * @param {number} props.timestamp - The Unix timestamp of the segment.
 * @param {string} props.text - The text content of the segment.
 * @param {function(number, string): void} props.onClick - Callback when the segment is clicked.
 * @param {object[]} [props.tags] - List of tags associated with this segment.
 */
function Segment({ timestamp, text, onClick, tags }) {
    const theme = useTheme();
    const enableTagHelper = useAppStore((state) => state.enableTagHelper);

    if (!enableTagHelper) {
        return <>{text}</>;
    }

    let decorationStyle = {};
    let tooltipContent = null;

    if (tags && tags.length > 0) {
        // Determine Priority: HBD > Chapter > Collection > Normal
        let priorityColor = null; // blue[300] default
        let isHbd = false;
        let isChapter = false;
        let isCollection = false;

        tags.forEach((t) => {
            if (t.subtype === "hbd") isHbd = true;
            if (t.subtype === "chapter") isChapter = true;
            if (t.subtype === "collection") isCollection = true;
        });

        if (isHbd) priorityColor = pink[300];
        else if (isChapter) priorityColor = orange[700];
        else if (isCollection) priorityColor = purple[300];
        else priorityColor = blue[300];

        decorationStyle = {
            borderBottom: `2px solid ${priorityColor}`,
            display: "inline-block", // Needed for border to show properly on span?
            lineHeight: "1.2", // Adjust line height if border pushes things apart
        };

        tooltipContent = (
            <Box sx={{ p: 0.5 }}>
                {tags.map((tag, i) => (
                    <Typography key={tag.id || i} variant="caption" display="block">
                        {tag.type === "header" ? (
                            <strong>
                                {tag.subtype}: {tag.name}
                            </strong>
                        ) : (
                            <>
                                <strong>[{tag.timestamp}]</strong> {tag.text}
                            </>
                        )}
                    </Typography>
                ))}
            </Box>
        );
    }

    const content = (
        <SegmentTheme theme={theme} onClick={() => onClick(timestamp, text)} style={decorationStyle}>
            {text}
        </SegmentTheme>
    );

    if (tooltipContent) {
        return (
            <Tooltip title={tooltipContent} arrow>
                {content}
            </Tooltip>
        );
    }

    return content;
}

export default memo(Segment);
