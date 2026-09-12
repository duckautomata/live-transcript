/**
 * Scroll to and focus the input (or section) that owns a problem, by the
 * data-field attribute every bound input and section carries.
 * @param {string} path
 */
export function focusField(path) {
    const el =
        document.querySelector(`[data-field="${path}"]`) ||
        document.querySelector(`[data-field="${path.split(".")[0]}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    if (typeof el.focus === "function" && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) el.focus();
}
