import { Box, IconButton, InputAdornment, TextField, Typography, useMediaQuery } from "@mui/material";
import { useContext, useState } from "react";
import { TranscriptContext } from "../providers/TranscriptProvider";
import { Clear, Search } from "@mui/icons-material";
import Transcript from "./Transcript";
import { Route, Routes } from "react-router-dom";
import StreamWordCount from "./StreamWordCount";
import Tagging from "./Tagging";

export default function TranscriptViewer({ wsKey }) {
    const { activeTitle, isLive } = useContext(TranscriptContext);
    const [searchTerm, setSearchTerm] = useState("");
    const isMobile = useMediaQuery("(max-width:768px)");

    const liveText = isLive ? "live" : "offline";

    return (
        <div style={{ width: "100%", height: "97vh", display: "flex", flexDirection: "column" }}>
            {isMobile ? (
                <Typography color="primary" variant="h5" component="h5" sx={{ mb: 2, wordBreak: "break-word" }}>
                    {activeTitle}
                </Typography>
            ) : (
                <Typography color="primary" variant="h4" component="h4" sx={{ mb: 2, wordBreak: "break-word" }}>
                    {activeTitle}
                </Typography>
            )}

            <Typography color="secondary" variant="h6" component="h6" sx={{ mb: 2 }} id={liveText}>
                {wsKey.charAt(0).toUpperCase() + wsKey.slice(1)}&#39;s Stream is {liveText}.
            </Typography>
            <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center" }}>
                <TextField
                    label="Search Transcript"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{ width: isMobile ? "100%" : "50%" }}
                />
                {searchTerm && ( // Conditionally render clear button
                    <IconButton
                        onClick={() => {
                            setSearchTerm("");
                        }}
                        aria-label="clear search"
                    >
                        <Clear />
                    </IconButton>
                )}
            </Box>
            <hr style={{ width: "100%" }} />

            <Routes>
                <Route path={`*`} element={<Transcript wsKey={wsKey} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />} />
                <Route path={`graph/`} element={<StreamWordCount searchTerm={searchTerm} />} />
                <Route path={`tagging/`} element={<Tagging wsKey={wsKey} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />} />
            </Routes>

            
        </div>
    );
}
