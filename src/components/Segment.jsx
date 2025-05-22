import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { useContext } from "react";
import { SettingContext } from "../providers/SettingProvider";

const SegmentTheme = styled("span")(({ theme }) => ({
    cursor: "pointer",
    "&:hover": {
        backgroundColor: theme.palette.secondary.background,
    },
}));

export default function Segment({ timestamp, text, onClick }) {
    const theme = useTheme();
    const { enableTagHelper } = useContext(SettingContext);

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
