import { useEffect } from "react";
import { baseTitle } from "../config";

/**
 * Set the browser tab title while the calling component is mounted ("Doki · Live Transcript").
 * An empty title shows just the base title. Useful now that pages can be opened in several tabs.
 * @param {string} [title]
 */
export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · ${baseTitle}` : baseTitle;
        return () => {
            document.title = baseTitle;
        };
    }, [title]);
}
