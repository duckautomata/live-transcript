import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { useAppStore } from "../../store/store";
import NotificationsHome from "./NotificationsHome";
import EventEditorPage from "./editor/EventEditorPage";

/**
 * The editor is remounted, with a fresh store, whenever the channel, the
 * event or the account changes. An expired session keeps the account (and
 * so the draft); a different account signing in on the same tab starts clean.
 */
function EditorRoute() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const user = useAppStore((state) => state.accountUser);
    const owner = (user && user.username) || "";
    return <EventEditorPage key={`${owner}:${searchParams.get("channel") || ""}:${id}`} />;
}

/**
 * Notification events: get your own Discord pinged when a channel goes live,
 * schedules a stream, or publishes a video or short. The list and the editor
 * are separate routes so nothing on the list page can disturb an edit.
 */
export default function NotificationsPage() {
    return (
        <Routes>
            <Route path="events/:id/*" element={<EditorRoute />} />
            <Route path="*" element={<NotificationsHome />} />
        </Routes>
    );
}
