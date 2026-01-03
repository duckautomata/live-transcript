import { useEffect, useRef } from "react";
import { useAppStore } from "../store/store";
import { LOG_ERROR } from "../logic/debug";

/**
 * Hook to manage TagFormatter state synchronization with LocalStorage.
 * Loads tags when wsKey changes.
 * Saves tags when store state changes.
 * @param {string} wsKey
 */
export const useTagIntegration = (wsKey) => {
    const formattedRows = useAppStore((state) => state.formattedRows);
    const setFormattedRows = useAppStore((state) => state.setFormattedRows);
    const controls = useAppStore((state) => state.controls);
    const setControls = useAppStore((state) => state.setControls);
    const inputTags = useAppStore((state) => state.inputTags);
    const setInputTags = useAppStore((state) => state.setInputTags);

    const loadedKeyRef = useRef(null);

    // Load Effect
    useEffect(() => {
        if (!wsKey) return;
        if (loadedKeyRef.current === wsKey) return;

        const savedInput = localStorage.getItem(`tagFormatter_input_${wsKey}`);
        const savedRows = localStorage.getItem(`tagFormatter_rows_${wsKey}`);
        const savedControls = localStorage.getItem(`tagFormatter_controls_${wsKey}`);

        // Reset or Load
        setInputTags(savedInput || "");

        let loadedRows = [];
        if (savedRows) {
            try {
                loadedRows = JSON.parse(savedRows);
            } catch (e) {
                LOG_ERROR("Failed to load rows", e);
            }
        }
        setFormattedRows(loadedRows);

        let loadedControls = {};
        if (savedControls) {
            try {
                loadedControls = JSON.parse(savedControls);
            } catch (e) {
                LOG_ERROR("Failed to load controls", e);
            }
        }
        setControls(loadedControls);

        loadedKeyRef.current = wsKey;
    }, [wsKey, setFormattedRows, setControls, setInputTags]);

    // Save Effects
    useEffect(() => {
        if (!wsKey || loadedKeyRef.current !== wsKey) return;
        localStorage.setItem(`tagFormatter_input_${wsKey}`, inputTags);
    }, [inputTags, wsKey]);

    useEffect(() => {
        if (!wsKey || loadedKeyRef.current !== wsKey) return;
        // Logic from TagFormatter: save if non-empty, or if empty (to plain clear)
        // We always save to stay in sync
        localStorage.setItem(`tagFormatter_rows_${wsKey}`, JSON.stringify(formattedRows));
    }, [formattedRows, wsKey]);

    useEffect(() => {
        if (!wsKey || loadedKeyRef.current !== wsKey) return;
        localStorage.setItem(`tagFormatter_controls_${wsKey}`, JSON.stringify(controls));
    }, [controls, wsKey]);
};
