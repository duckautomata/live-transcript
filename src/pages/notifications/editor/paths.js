/**
 * Reading and writing draft fields by path ("name", "content", "embed.title"),
 * shared by every bound input.
 */

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
 * Insert text at the caret of the input bound to a path, keeping focus and
 * the caret where typing would continue.
 * @param {import("zustand/vanilla").StoreApi<any>} store
 * @param {string} path
 * @param {{current: HTMLInputElement | HTMLTextAreaElement | null}} inputRef
 * @param {string} text
 */
export function insertAtCaret(store, path, inputRef, text) {
    const el = inputRef.current;
    const current = getPath(store.getState().draft, path) || "";
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : current.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : current.length;
    setPath(store, path, current.slice(0, start) + text + current.slice(end));
    if (!el) return;
    requestAnimationFrame(() => {
        el.focus();
        const pos = start + text.length;
        try {
            el.setSelectionRange(pos, pos);
        } catch {
            // Not every input supports selection ranges; the text is in either way.
        }
    });
}
