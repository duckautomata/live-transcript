import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import { useStore } from "zustand";
import { ApiError, errorMessage, notificationsApi } from "../../../logic/api";
import { cleanedEvent, createDraftStore } from "../../../logic/eventDraft";
import { notificationsPath } from "../../../logic/links";
import { useAppStore } from "../../../store/store";
import AccountDialog from "../AccountDialog";
import ConfirmDialog from "../ConfirmDialog";
import TestSendDialog from "../TestSendDialog";
import { useChannel } from "../useChannel";
import CooldownSection from "./CooldownSection";
import EditorProvider from "./EditorProvider";
import { useEditor } from "./editorContext";
import EditorTopBar from "./EditorTopBar";
import MessageSection from "./MessageSection";
import NameRow from "./NameRow";
import PreviewPane from "./PreviewPane";
import ProblemsSummary from "./ProblemsSummary";
import { focusField } from "./focusField";
import TriggersSection from "./TriggersSection";
import WebhooksSection from "./WebhooksSection";

/**
 * Create or edit a notification event, on its own route. The draft lives in
 * a store created once per visit and mirrored to session storage, so the
 * list page's refreshes, a browser tab switch or a reload never touch it.
 * The page is keyed by channel and event id by its route, so a different
 * event is always a fresh store.
 */
export default function EventEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { channel, channelName, channelIcon } = useChannel();
    const token = useAppStore((state) => state.accountToken);
    const user = useAppStore((state) => state.accountUser);
    const accountDialogOpen = useAppStore((state) => state.accountDialogOpen);
    const setAccountDialogOpen = useAppStore((state) => state.setAccountDialogOpen);
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [store, setStore] = useState(null);
    const eventId = id === "new" ? 0 : Number(id) || 0;
    const owner = (user && user.username) || "";

    // The vocabulary (triggers, placeholders, limits, defaults) and, when
    // editing, the saved event. Fetched once per channel and sign-in.
    useEffect(() => {
        if (!token) return undefined;
        const ac = new AbortController();
        setLoadError("");
        notificationsApi
            .list(channel, ac.signal)
            .then(setData)
            .catch((err) => {
                if (err && err.name === "AbortError") return;
                setLoadError(errorMessage(err));
            });
        return () => ac.abort();
    }, [channel, token]);

    // The store is created once, from the first data that arrives, and kept
    // through any later refetch: nothing outside the editor may reset it.
    useEffect(() => {
        if (!data || store) return;
        const event = eventId ? data.events.find((e) => e.id === eventId) : null;
        if (eventId && !event) return;
        setStore(
            createDraftStore({
                owner,
                channel,
                event,
                defaults: data.defaults,
                limits: data.limits,
                triggerOrder: data.triggers.map((t) => t.id),
            }),
        );
    }, [data, store, eventId, channel, owner]);

    const vocab = useMemo(
        () =>
            data && {
                triggers: data.triggers,
                placeholders: data.placeholders,
                defaults: data.defaults,
                limits: data.limits,
            },
        [data],
    );

    const backToList = () => navigate(notificationsPath(channel));

    if (!token) {
        return (
            <Shell channelName={channelName} onBack={backToList}>
                <Typography sx={{ mb: 2 }}>Sign in to set up notification events.</Typography>
                <Button variant="contained" onClick={() => setAccountDialogOpen(true)} data-testid="editor-sign-in">
                    Sign in or create an account
                </Button>
                <AccountDialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} />
            </Shell>
        );
    }
    if (loadError && !store) {
        return (
            <Shell channelName={channelName} onBack={backToList}>
                <Alert severity="error">Could not load: {loadError}</Alert>
            </Shell>
        );
    }
    if (data && eventId && !data.events.some((e) => e.id === eventId) && !store) {
        return (
            <Shell channelName={channelName} onBack={backToList}>
                <Typography sx={{ mb: 2 }} data-testid="editor-missing">
                    This event no longer exists.
                </Typography>
                <Button variant="outlined" onClick={backToList}>
                    Back to events
                </Button>
            </Shell>
        );
    }
    if (!store || !vocab) {
        return (
            <Shell channelName={channelName} onBack={backToList}>
                <Skeleton width={320} height={40} />
                <Skeleton width="60%" />
                <Skeleton width="80%" />
            </Shell>
        );
    }
    return (
        <EditorProvider store={store} vocab={vocab} channel={channel} channelName={channelName}>
            <EditorBody channelIcon={channelIcon} onBackToList={backToList} />
        </EditorProvider>
    );
}

/** The frame the loading, signed-out and missing states share. */
function Shell({ channelName, onBack, children }) {
    const isMobile = useMediaQuery("(max-width:768px)");
    return (
        <Box
            sx={{
                maxWidth: 960,
                mx: "auto",
                pl: isMobile ? 7 : { xs: 1.5, sm: 3 },
                pr: { xs: 1.5, sm: 3 },
                py: 2,
                textAlign: "left",
            }}
        >
            <Button onClick={onBack} size="small" sx={{ mb: 2 }} data-testid="editor-back">
                ← Back to events
            </Button>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {channelName}
            </Typography>
            <Box sx={{ mt: 1 }}>{children}</Box>
        </Box>
    );
}

/**
 * The form's sections take nothing from their parent, so this renders once
 * per visit; every field re-renders itself from the store.
 */
const EditorForm = memo(function EditorForm({ serverError }) {
    return (
        <>
            <ProblemsSummary serverError={serverError} />
            <NameRow />
            <TriggersSection />
            <WebhooksSection />
            <MessageSection />
            <CooldownSection />
        </>
    );
});

function EditorBody({ channelIcon, onBackToList }) {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:899px)");
    const showToast = useAppStore((state) => state.showToast);
    const token = useAppStore((state) => state.accountToken);
    const accountDialogOpen = useAppStore((state) => state.accountDialogOpen);
    const setAccountDialogOpen = useAppStore((state) => state.setAccountDialogOpen);
    const { store, channel } = useEditor();
    const restored = useStore(store, (s) => s.restored);
    const [tab, setTab] = useState("edit");
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);
    const [serverError, setServerError] = useState("");
    const [test, setTest] = useState(null);
    const [leaving, setLeaving] = useState(false);

    // A fresh sign-in after an expiry clears the note that asked for it.
    useEffect(() => {
        setServerError((e) => (e && e.startsWith("Your session expired") ? "" : e));
    }, [token]);

    const showProblems = useCallback(
        (path) => {
            if (isMobile) setTab("edit");
            requestAnimationFrame(() => focusField(path || "summary"));
        },
        [isMobile],
    );

    const save = async () => {
        if (savingRef.current) return;
        const st = store.getState();
        if (!st.validate()) {
            showProblems(Object.keys(store.getState().problems.byPath)[0]);
            return;
        }
        savingRef.current = true;
        setSaving(true);
        setServerError("");
        try {
            const body = cleanedEvent(st.draft);
            const saved = st.isNew
                ? await notificationsApi.create(channel, body, { keepSession: true })
                : await notificationsApi.update(channel, st.eventId, body, { keepSession: true });
            st.clearStorage();
            showToast(st.isNew ? `Created “${saved.name}”` : `Saved “${saved.name}”`, "success");
            navigate(notificationsPath(channel));
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setServerError("Your session expired. Sign in again and save; the draft is kept.");
                setAccountDialogOpen(true);
            } else {
                setServerError(errorMessage(err));
            }
            showProblems("summary");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const openTest = (sample) => {
        const st = store.getState();
        if (!st.validate({ needWebhooks: false })) {
            showProblems("summary");
            return;
        }
        setTest({ draft: cleanedEvent(st.draft), trigger: st.previewTrigger, sample: sample || {} });
    };

    const back = () => {
        if (store.getState().dirty) setLeaving(true);
        else onBackToList();
    };

    // Ctrl/Cmd+S saves, as in every editor; a held key saves once.
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (!e.repeat) save();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const showEdit = !isMobile || tab === "edit";
    const showPreview = !isMobile || tab === "preview";

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", textAlign: "left" }}>
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 3,
                    bgcolor: "background.default",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <EditorTopBar
                    onBack={back}
                    onSave={save}
                    onProblems={() => showProblems("summary")}
                    saving={saving}
                    channelIcon={channelIcon}
                />
                {isMobile && (
                    <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth">
                        <Tab value="edit" label="Edit" data-testid="editor-tab-edit" />
                        <Tab value="preview" label="Preview" data-testid="editor-tab-preview" />
                    </Tabs>
                )}
            </Box>
            {restored && (
                <Alert
                    severity="info"
                    sx={{ mx: { xs: 1.5, sm: 2, md: 3 }, mt: 2 }}
                    action={
                        <Button
                            size="small"
                            onClick={() => store.getState().discard()}
                            data-testid="editor-draft-discard"
                        >
                            Discard
                        </Button>
                    }
                    data-testid="editor-draft-restored"
                >
                    Restored your unsaved draft.
                </Alert>
            )}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 7fr) minmax(320px, 5fr)" },
                    gap: { xs: 3, md: 4 },
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: 3,
                }}
            >
                <Box sx={{ display: showEdit ? "flex" : "none", flexDirection: "column", gap: 4 }}>
                    <EditorForm serverError={serverError} />
                </Box>
                <Box
                    sx={{
                        display: showPreview ? "block" : "none",
                        position: { md: "sticky" },
                        top: { md: 72 },
                        alignSelf: "start",
                    }}
                >
                    <PreviewPane onTest={openTest} onSignIn={() => setAccountDialogOpen(true)} />
                </Box>
            </Box>
            {test && (
                <TestSendDialog
                    open
                    onClose={() => setTest(null)}
                    channel={channel}
                    draft={test.draft}
                    trigger={test.trigger}
                    sample={test.sample}
                />
            )}
            <ConfirmDialog
                open={leaving}
                title="Leave this event?"
                message="Your changes are kept as a draft in this browser tab. Come back to keep editing, or discard them now."
                okLabel="Keep draft and leave"
                danger={false}
                cancelLabel="Keep editing"
                secondaryLabel="Discard changes"
                secondaryColor="error"
                onSecondary={() => {
                    store.getState().discard();
                    setLeaving(false);
                    onBackToList();
                }}
                onCancel={() => setLeaving(false)}
                onConfirm={() => {
                    setLeaving(false);
                    onBackToList();
                }}
            />
            <AccountDialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} />
        </Box>
    );
}
