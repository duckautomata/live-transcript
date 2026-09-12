import { createContext, useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

/** The editor's draft store, vocabulary and channel, for every field inside it. */
export const EditorContext = createContext(null);

/** The store, vocabulary and channel of the editor this component is inside. */
export function useEditor() {
    return useContext(EditorContext);
}

/**
 * Subscribe to one value of the draft store; re-renders only when it changes.
 * @template T
 * @param {(state: any) => T} selector
 * @returns {T}
 */
export function useDraft(selector) {
    const { store } = useContext(EditorContext);
    return useStore(store, selector);
}

/** Like useDraft for selectors that build a small array or object. */
export function useDraftShallow(selector) {
    const { store } = useContext(EditorContext);
    return useStore(store, useShallow(selector));
}

/** The store's actions, read fresh at call time. */
export function useActions() {
    const { store } = useContext(EditorContext);
    return store.getState;
}
