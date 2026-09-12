import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box } from "@mui/material";
import { errorMessage, notificationsApi } from "../../logic/api";
import { eventEditorPath } from "../../logic/links";
import { useAppStore } from "../../store/store";
import AccountDialog from "./AccountDialog";
import ActivitySection from "./ActivitySection";
import ChannelPicker from "./ChannelPicker";
import ConfirmDialog from "./ConfirmDialog";
import EventsSection from "./EventsSection";
import HealthLine from "./HealthLine";
import PageHeader from "./PageHeader";
import { useChannel } from "./useChannel";

/** A refresh on returning to the tab is skipped when the data is this fresh. */
const FRESH_MS = 15000;

/**
 * The list page: the channel's events for the signed-in account, whether
 * live detection is watching the channel, and what it recently saw and sent.
 */
export default function NotificationsHome() {
    const navigate = useNavigate();
    const { channels, channel, channelName, setChannel, searchParams, setSearchParams } = useChannel();
    const token = useAppStore((state) => state.accountToken);
    const user = useAppStore((state) => state.accountUser);
    const accountNotice = useAppStore((state) => state.accountNotice);
    const clearAccountNotice = useAppStore((state) => state.clearAccountNotice);
    const accountDialogOpen = useAppStore((state) => state.accountDialogOpen);
    const setAccountDialogOpen = useAppStore((state) => state.setAccountDialogOpen);
    const showToast = useAppStore((state) => state.showToast);

    const [accountMode, setAccountMode] = useState("signin");
    const [status, setStatus] = useState(null);
    const [statusError, setStatusError] = useState("");
    const [data, setData] = useState(null);
    const [dataError, setDataError] = useState("");
    const [busy, setBusy] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const fetchedAt = useRef(0);
    const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

    // Public: detection status and recent detections.
    useEffect(() => {
        const ac = new AbortController();
        setStatusError("");
        notificationsApi
            .liveDetect(channel, ac.signal)
            .then(setStatus)
            .catch((err) => {
                if (err && err.name === "AbortError") return;
                setStatusError(errorMessage(err));
            });
        return () => ac.abort();
    }, [channel, reloadKey]);

    // The account's events and deliveries.
    useEffect(() => {
        if (!token) {
            setData(null);
            setDataError("");
            return undefined;
        }
        const ac = new AbortController();
        setDataError("");
        notificationsApi
            .list(channel, ac.signal)
            .then((res) => {
                fetchedAt.current = Date.now();
                setData(res);
            })
            .catch((err) => {
                if (err && err.name === "AbortError") return;
                setDataError(errorMessage(err));
            });
        return () => ac.abort();
    }, [channel, token, reloadKey]);

    // Coming back to the tab is the moment fresh data is wanted. Only this
    // page listens: the editor is a separate route it cannot reach.
    useEffect(() => {
        const onVisible = () => {
            if (!document.hidden && Date.now() - fetchedAt.current > FRESH_MS) refresh();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [refresh]);

    const activity = searchParams.get("activity") === "deliveries" ? "deliveries" : "detections";
    const setActivity = (value) =>
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("activity", value);
                return next;
            },
            { replace: true },
        );

    const openAccount = (mode) => {
        setAccountMode(mode);
        setAccountDialogOpen(true);
    };

    const toggleEvent = useCallback(
        async (ev) => {
            const enabled = !ev.enabled;
            // Optimistic: the row flips at once and is put back if the server says no.
            setData((d) => d && { ...d, events: d.events.map((e) => (e.id === ev.id ? { ...e, enabled } : e)) });
            setBusy(true);
            try {
                await notificationsApi.update(channel, ev.id, { ...ev, enabled });
                showToast(
                    enabled ? `Resumed “${ev.name}”` : `Paused “${ev.name}” - it will not post until resumed`,
                    "success",
                );
                refresh();
            } catch (err) {
                setData((d) => d && { ...d, events: d.events.map((e) => (e.id === ev.id ? ev : e)) });
                showToast(errorMessage(err), "error");
            } finally {
                setBusy(false);
            }
        },
        [channel, refresh, showToast],
    );

    const openEditor = useCallback((ev) => navigate(eventEditorPath(channel, ev.id)), [navigate, channel]);
    const askDelete = useCallback((ev) => setPendingDelete(ev), []);

    const deleteEvent = async () => {
        const ev = pendingDelete;
        if (!ev) return;
        setBusy(true);
        try {
            await notificationsApi.remove(channel, ev.id);
            showToast(`Deleted “${ev.name}”`, "success");
            setPendingDelete(null);
            refresh();
        } catch (err) {
            showToast(errorMessage(err), "error");
        } finally {
            setBusy(false);
        }
    };

    const signedIn = Boolean(token && user);
    const hooks = pendingDelete ? (pendingDelete.webhooks || []).length : 0;

    return (
        <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 2, textAlign: "left" }}>
            <PageHeader
                channelName={channelName}
                signedIn={signedIn}
                onSignIn={() => openAccount("signin")}
                onRefresh={refresh}
            />
            {accountNotice === "expired" && (
                <Alert severity="info" onClose={clearAccountNotice} sx={{ mb: 2 }}>
                    Your session expired. Sign in again to manage your events.
                </Alert>
            )}
            <ChannelPicker channels={channels} channel={channel} onChange={setChannel} />
            <HealthLine status={status} error={statusError} />
            <EventsSection
                data={data}
                error={dataError}
                signedIn={signedIn}
                busy={busy}
                channel={channel}
                channelName={channelName}
                owner={(user && user.username) || ""}
                onSignIn={() => openAccount("signin")}
                onCreateAccount={() => openAccount("register")}
                onNew={() => navigate(eventEditorPath(channel, "new"))}
                onEdit={openEditor}
                onToggle={toggleEvent}
                onDelete={askDelete}
            />
            <ActivitySection
                status={status}
                signedIn={signedIn}
                log={data ? data.log : []}
                activity={activity}
                onActivity={setActivity}
            />
            <AccountDialog
                open={accountDialogOpen}
                initialMode={accountMode}
                onClose={() => setAccountDialogOpen(false)}
            />
            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title={pendingDelete ? `Delete “${pendingDelete.name}”?` : ""}
                message={`It stops posting to its ${hooks} webhook${hooks === 1 ? "" : "s"}. The webhooks themselves are not touched in Discord.\n\nThis cannot be undone.`}
                okLabel="Delete"
                busy={busy}
                onCancel={() => setPendingDelete(null)}
                onConfirm={deleteEvent}
            />
        </Box>
    );
}
