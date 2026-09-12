import { useMemo } from "react";
import { EditorContext } from "./editorContext";

/**
 * Hands the editor's draft store and the server's vocabulary to every field.
 * Fields subscribe to the store with selectors, so a keystroke re-renders
 * only the field it landed in.
 * @param {object} props
 * @param {import("zustand/vanilla").StoreApi<any>} props.store
 * @param {object} props.vocab - triggers, placeholders, defaults, limits from the server
 * @param {string} props.channel
 * @param {string} props.channelName
 * @param {React.ReactNode} props.children
 */
export default function EditorProvider({ store, vocab, channel, channelName, children }) {
    const value = useMemo(() => ({ store, vocab, channel, channelName }), [store, vocab, channel, channelName]);
    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
