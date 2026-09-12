import { server } from "../config";
import { useAppStore } from "../store/store";

/**
 * The server's JSON API for accounts and notification events.
 *
 * Sessions are bearer tokens: the token from sign-in is kept in the store (and
 * so in localStorage) and sent as `Authorization: Bearer` on every account
 * request. Nothing else about a request carries identity, so a forged
 * cross-site request has no way to act as the user.
 */

/** An error from the API, with the HTTP status and the server's message. */
export class ApiError extends Error {
    /**
     * @param {number} status - HTTP status, or 0 when the server was unreachable
     * @param {string} message
     * @param {number} [retryAfter] - seconds, from a 429
     */
    constructor(status, message, retryAfter = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.retryAfter = retryAfter;
    }
}

/**
 * Perform one request. Throws ApiError on any non-2xx answer; a 401 on an
 * authenticated request also signs the store out, since the token is dead.
 * @param {string} path - path under the API base, e.g. "/auth/me"
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {any} [options.body] - JSON-encoded when present
 * @param {boolean} [options.auth] - send the session token (default true)
 * @param {boolean} [options.keepSession] - on a 401, leave the store signed in so the caller can
 *   handle it (the editor keeps its draft and asks for a fresh sign-in instead of vanishing)
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<any>} the decoded JSON body, or null for 204
 */
export async function apiFetch(path, { method = "GET", body, auth = true, keepSession = false, signal } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = auth ? useAppStore.getState().accountToken : "";
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
        res = await fetch(`${server}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
            cache: "no-store",
        });
    } catch (e) {
        if (e && e.name === "AbortError") throw e;
        throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
    }

    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }
    if (!res.ok) {
        if (res.status === 401 && auth && token && !keepSession) {
            useAppStore.getState().signOut("expired");
        }
        const message = (data && typeof data.error === "string" && data.error) || text.trim() || `HTTP ${res.status}`;
        throw new ApiError(res.status, message, Number(res.headers.get("Retry-After")) || 0);
    }
    return data;
}

export const authApi = {
    /** Whether sign-ups are open, and the credential rules. */
    info: () => apiFetch("/auth/info", { auth: false }),
    register: (username, password) =>
        apiFetch("/auth/register", { method: "POST", body: { username, password }, auth: false }),
    login: (username, password) =>
        apiFetch("/auth/login", { method: "POST", body: { username, password }, auth: false }),
    me: () => apiFetch("/auth/me"),
    logout: () => apiFetch("/auth/logout", { method: "POST" }),
    /** Sign every other session of the account out; this one stays. */
    logoutAll: () => apiFetch("/auth/logout-all", { method: "POST" }),
    /** Everyone signed in to the account, on every device. */
    sessions: () => apiFetch("/auth/sessions"),
    revokeSession: (id) => apiFetch(`/auth/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }),
    changePassword: (currentPassword, newPassword) =>
        apiFetch("/auth/password", { method: "POST", body: { currentPassword, newPassword } }),
    deleteAccount: (password) => apiFetch("/auth/account", { method: "DELETE", body: { password } }),
};

export const notificationsApi = {
    /** Public: detection health and recent detections for a channel. */
    liveDetect: (channel, signal) => apiFetch(`/${channel}/livedetect`, { auth: false, signal }),
    list: (channel, signal) => apiFetch(`/${channel}/notifications`, { signal }),
    /** The editor passes keepSession so a 401 leaves its draft in place; the list page does not. */
    create: (channel, event, { keepSession = false } = {}) =>
        apiFetch(`/${channel}/notifications`, { method: "POST", body: event, keepSession }),
    update: (channel, id, event, { keepSession = false } = {}) =>
        apiFetch(`/${channel}/notifications/${encodeURIComponent(id)}`, { method: "PUT", body: event, keepSession }),
    remove: (channel, id) => apiFetch(`/${channel}/notifications/${encodeURIComponent(id)}`, { method: "DELETE" }),
    preview: (channel, event, trigger, signal) =>
        apiFetch(`/${channel}/notifications/preview`, {
            method: "POST",
            body: { event, trigger },
            signal,
            keepSession: true,
        }),
    test: (channel, event, trigger, webhook) =>
        apiFetch(`/${channel}/notifications/test`, {
            method: "POST",
            body: { event, trigger, webhookUrl: webhook.url, webhookName: webhook.name || "" },
            keepSession: true,
        }),
};

/**
 * A message for people from any error the API code throws.
 * @param {unknown} err
 * @returns {string}
 */
export function errorMessage(err) {
    if (err instanceof ApiError) return err.message;
    if (err && typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
    return "Something went wrong.";
}
