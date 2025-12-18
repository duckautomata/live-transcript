import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { useAppStore } from "../store/store";

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
 */
export default function Segment({ timestamp, text, onClick }) {
    const theme = useTheme();
    const enableTagHelper = useAppStore((state) => state.enableTagHelper);

    return (
        <>
            {enableTagHelper ? (
                <SegmentTheme theme={theme} onClick={() => onClick(timestamp, text)}>
                    {text}
                </SegmentTheme>
            ) : (
                text
            )}
        </>
    );
}
