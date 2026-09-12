import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { keyIcons } from "../../config";
import { useAppStore } from "../../store/store";

/**
 * The channel the notifications pages are about, from ?channel=. An unknown
 * value falls back to the first channel and the URL is rewritten to match,
 * so the address and the page never disagree.
 */
export function useChannel() {
    const [searchParams, setSearchParams] = useSearchParams();
    const devMode = useAppStore((state) => state.devMode);
    const channels = useMemo(() => keyIcons(28, devMode), [devMode]);
    const requested = searchParams.get("channel");
    const valid = channels.some((c) => c.value === requested);
    const channel = valid ? requested : channels[0].value;

    useEffect(() => {
        if (valid) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("channel", channel);
                return next;
            },
            { replace: true },
        );
    }, [valid, channel, setSearchParams]);

    const setChannel = useCallback(
        (value) =>
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("channel", value);
                    return next;
                },
                { replace: true },
            ),
        [setSearchParams],
    );

    const info = channels.find((c) => c.value === channel) || {};
    return {
        channels,
        channel,
        channelName: info.name || channel,
        channelIcon: info.icon || null,
        setChannel,
        searchParams,
        setSearchParams,
    };
}
