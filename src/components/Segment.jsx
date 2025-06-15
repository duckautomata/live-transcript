import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { useAppStore } from "../store/store";

const SegmentTheme = styled("span")(({ theme }) => ({
    cursor: "pointer",
    "&:hover": {
        backgroundColor: theme.palette.secondary.background,
    },
}));

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
