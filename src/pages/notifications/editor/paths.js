/**
 * Reading and writing draft fields by path ("name", "content", "embed.title"),
 * shared by every bound input.
 */

import { placeOnOwnLine } from "../../../logic/notifications";

/**
 * Read a field of the draft by path.
 * @param {object} draft
 * @param {string} path
 */
export function getPath(draft, path) {
    if (path.startsWith("embed.")) return (draft.embed || {})[path.slice(6)];
    return draft[path];
}

/**
 * Write a field of the draft by path through the store's actions.
 * @param {import("zustand/vanilla").StoreApi<any>} store
 * @param {string} path
 * @param {any} value
 */
export function setPath(store, path, value) {
    const s = store.getState();
    if (path === "name") s.setName(value);
    else if (path.startsWith("embed.")) s.setEmbed({ [path.slice(6)]: value });
    else s.set({ [path]: value });
}

/**
 * Inputs the author has been in. A field that was never focused still reports
 * a caret - at 0 - so a chip clicked under the pre-filled Card description
 * would put its text above the title. Nobody chose that spot: such a field
 * takes the insert at its end, like text being added to it.
 */
const focusedOnce = new WeakSet();

/** onFocus for every bound input, so insertAtCaret can tell a real caret from a default one. */
export const noteFocus = (e) => focusedOnce.add(e.target);

/**
 * Insert text at the caret of the input bound to a path, keeping focus and
 * the caret where typing would continue.
 * @param {import("zustand/vanilla").StoreApi<any>} store
 * @param {string} path
 * @param {{current: HTMLInputElement | HTMLTextAreaElement | null}} inputRef
 * @param {string} text
 * @param {{ownLine?: boolean}} [opts] - ownLine gives the text a line to itself (multi-line placeholders)
 */
export function insertAtCaret(store, path, inputRef, text, opts = {}) {
    const el = inputRef.current;
    const current = getPath(store.getState().draft, path) || "";
    const hasCaret = el && focusedOnce.has(el) && typeof el.selectionStart === "number";
    const start = hasCaret ? el.selectionStart : current.length;
    const end = hasCaret ? el.selectionEnd : current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const placed = opts.ownLine
        ? placeOnOwnLine(before, text, after)
        : { text: before + text + after, caret: start + text.length };
    setPath(store, path, placed.text);
    if (!el) return;
    requestAnimationFrame(() => {
        // The caret first, focus last: focusing scrolls the caret into view,
        // and the caret React's value write left behind is at the end of the
        // text, which in a long field is nowhere near what was just inserted.
        const pos = placed.caret;
        try {
            el.setSelectionRange(pos, pos);
        } catch {
            // Not every input supports selection ranges; the text is in either way.
        }
        el.focus();
    });
}
