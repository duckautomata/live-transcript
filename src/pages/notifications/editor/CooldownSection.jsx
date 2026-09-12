import { useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import Section from "./Section";
import { useActions, useDraft } from "./editorContext";
import { COOLDOWN_PRESETS, cooldownPreset, humanGap, unitFor } from "../../../logic/notifications";

const UNITS = [
    { value: 1, label: "seconds" },
    { value: 60, label: "minutes" },
    { value: 3600, label: "hours" },
];

const HELP = (
    <>
        After a ping, the same trigger stays quiet for this long. A stream that drops and restarts is a brand-new
        broadcast to Twitch or YouTube and would ping everyone again; 30 minutes swallows that while still announcing a
        second stream later in the day.
        <br />
        <br />
        Off pings on every detection. Skipped pings are listed under Deliveries.
    </>
);

/**
 * Step 4: the minimum gap between pings, as a short list of choices with a
 * custom amount for anything else.
 */
export default function CooldownSection() {
    const seconds = useDraft((s) => s.draft.cooldownSeconds);
    const problem = useDraft((s) => s.problems.byPath.cooldownSeconds || "");
    const actions = useActions();
    const [custom, setCustom] = useState(() => cooldownPreset(seconds) === "custom");
    const [unit, setUnit] = useState(() => unitFor(Number(seconds) || 0));
    const [amount, setAmount] = useState(() => {
        const n = Number(seconds) || 0;
        return n > 0 ? String(Math.round(n / unitFor(n))) : "";
    });
    const preset = custom ? "custom" : cooldownPreset(seconds);

    const choose = (value) => {
        if (value === "custom") {
            setCustom(true);
            const n = Number(seconds) || 0;
            const u = unitFor(n);
            setUnit(u);
            setAmount(n > 0 ? String(Math.round(n / u)) : "");
            if (n <= 0) actions().set({ cooldownSeconds: Number.NaN });
            return;
        }
        setCustom(false);
        actions().set({ cooldownSeconds: Number(value) });
    };
    const applyCustom = (text, u) => {
        setAmount(text);
        setUnit(u);
        const n = text.trim() === "" ? Number.NaN : Number(text);
        actions().set({ cooldownSeconds: Number.isFinite(n) ? Math.round(n * u) : Number.NaN });
    };

    return (
        <Section number={4} title="How often may it post?" help={HELP} error={problem} field="cooldownSeconds">
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="cooldown-preset-label">Minimum gap between pings</InputLabel>
                    <Select
                        labelId="cooldown-preset-label"
                        label="Minimum gap between pings"
                        value={preset}
                        onChange={(e) => choose(e.target.value)}
                        data-testid="editor-cooldown-preset"
                    >
                        {COOLDOWN_PRESETS.map((p) => (
                            <MenuItem key={p.value} value={p.value}>
                                {p.label}
                            </MenuItem>
                        ))}
                        <MenuItem value="custom">Custom…</MenuItem>
                    </Select>
                </FormControl>
                {custom && (
                    <>
                        <TextField
                            label="Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => applyCustom(e.target.value, unit)}
                            variant="outlined"
                            size="small"
                            error={Boolean(problem)}
                            sx={{ width: 120 }}
                            slotProps={{ htmlInput: { min: 0, step: 1, "data-testid": "editor-cooldown" } }}
                        />
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel id="cooldown-unit-label">Unit</InputLabel>
                            <Select
                                labelId="cooldown-unit-label"
                                label="Unit"
                                value={unit}
                                onChange={(e) => applyCustom(amount, Number(e.target.value))}
                                data-testid="editor-cooldown-unit"
                            >
                                {UNITS.map((u) => (
                                    <MenuItem key={u.value} value={u.value}>
                                        {u.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ color: "text.secondary", alignSelf: "center" }}>
                            {Number.isFinite(Number(seconds)) ? `= ${humanGap(seconds)}` : "Enter a number"}
                        </Typography>
                    </>
                )}
            </Box>
        </Section>
    );
}
