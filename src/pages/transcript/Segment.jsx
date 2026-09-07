import styled from "@emotion/styled";
import { Tooltip, Box, Typography } from "@mui/material";
import { orange, purple, pink, blue } from "@mui/material/colors";
import { memo } from "react";

/** @typedef {import("../../logic/search").TextPart} TextPart */

const SegmentTheme = styled("span")(({ theme }) => ({
    cursor: "pointer",
    "&:hover": {
        backgroundColor: theme.palette.secondary.background,
    },
}));

/** A search hit inside a line: tinted and underlined so it stands out in both themes. */
const SearchHit = styled("mark")(({ theme }) => ({
    backgroundColor: theme.palette.searchHighlight.background,
    color: theme.palette.searchHighlight.text,
    textDecoration: "underline",
    borderRadius: "2px",
}));

/**
 * Render a segment's text, wrapping every search hit in a highlight.
 * @param {string} text
 * @param {TextPart[] | null | undefined} parts - from `splitSegmentsByTerm`; falsy renders plain text
 */
function renderText(text, parts) {
    if (!parts) return text;
    return parts.map((part, index) =>
        part.hit ? (
            <SearchHit key={index} data-testid="search-hit">
                {part.text}
            </SearchHit>
        ) : (
            part.text
        ),
    );
}

/**
 * A single segment of text within a transcript line.
 * Subscribes to nothing itself: the line passes everything down so thousands of segments do not each
 * register a store listener.
 * @param {object} props
 * @param {number} props.id - The id of the segment.
 * @param {number} props.timestamp - The Unix timestamp of the segment.
 * @param {string} props.text - The text content of the segment.
 * @param {function(number, string): void} props.onClick - Callback when the segment is clicked.
 * @param {boolean} props.enableTagHelper - Whether the tag helper (click to open the offset calculator) is on.
 * @param {object[]} [props.tags] - List of tags associated with this segment.
 * @param {TextPart[] | null} [props.parts] - Search highlight parts for this segment, if any.
 */
function Segment({ id, timestamp, text, onClick, enableTagHelper, tags, parts }) {
    if (!enableTagHelper) {
        return <>{renderText(text, parts)}</>;
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
                {tags.map((tag, i) => {
                    let body;
                    if (tag.type === "header") {
                        const label = tag.subtype === "hbd" ? "birthday" : tag.subtype;
                        body = (
                            <strong>
                                {label}: {tag.name}
                            </strong>
                        );
                    } else if (tag.subtype === "hbd") {
                        body = (
                            <>
                                <strong>Birthday: [{tag.timestamp}]</strong> {tag.text}
                            </>
                        );
                    } else if (tag.subtype === "collection") {
                        body = (
                            <>
                                <strong>
                                    collection: {tag.parentName} [{tag.timestamp}]
                                </strong>{" "}
                                {tag.text}
                            </>
                        );
                    } else {
                        body = (
                            <>
                                <strong>[{tag.timestamp}]</strong> {tag.text}
                            </>
                        );
                    }
                    return (
                        <Typography key={tag.id || i} variant="caption" display="block">
                            {body}
                        </Typography>
                    );
                })}
            </Box>
        );
    }

    const content = (
        <SegmentTheme
            data-testid={`transcript-segment-${id}`}
            onClick={() => onClick(timestamp, text)}
            style={decorationStyle}
        >
            {renderText(text, parts)}
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
