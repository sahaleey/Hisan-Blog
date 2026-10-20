import { sql } from "@vercel/postgres";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/community-actions";
import { requireAuthenticatedUser } from "@/lib/permissions";

export default async function NotificationsPage() {
  const actor = await requireAuthenticatedUser("/notifications");
  const result = await sql`
    SELECT n.id, n.type, n.created_at, n.read_at, a.display_name AS actor_name, w.title AS work_title
    FROM notifications n
    LEFT JOIN authors a ON a.id = n.actor_id
    LEFT JOIN works w ON w.id = n.work_id
    WHERE n.recipient_id = ${actor.id}
    ORDER BY n.created_at DESC
    LIMIT 100
  `;

  const unreadCount = result.rows.filter((n) => !n.read_at).length;

  return (
    <div className="archive-page" style={{ maxWidth: "880px" }}>
      <div className="section-rule">
        <span>Reader Community</span>
        <form action={markAllNotificationsRead}>
          <button
            className="text-link"
            type="submit"
            style={{ fontSize: "0.72rem" }}
          >
            Mark all as read ✓
          </button>
        </form>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          margin: "0.5rem 0 2rem",
        }}
      >
        <h1
          className="display"
          style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", margin: 0 }}
        >
          Notifications.
        </h1>
        {unreadCount > 0 ? (
          <span className="status-submitted">{unreadCount} unread</span>
        ) : null}
      </div>

      {result.rows.length === 0 ? (
        <div className="empty-editorial" style={{ margin: "2rem 0" }}>
          <p className="eyebrow">Activity Inbox</p>
          <h2 className="display">Nothing new yet.</h2>
          <p>
            When readers like your writing, leave responses, or start following
            your author profile, updates will appear here.
          </p>
        </div>
      ) : (
        <div className="work-list">
          {result.rows.map((notification) => {
            const isUnread = !notification.read_at;
            return (
              <form
                className="work-row"
                action={markNotificationRead}
                key={notification.id}
                style={{
                  padding: "1.4rem 1rem",
                  background: isUnread ? "var(--color-surface)" : "transparent",
                  borderLeft: isUnread
                    ? "3px solid var(--color-accent)"
                    : "3px solid transparent",
                }}
              >
                <input
                  type="hidden"
                  name="notificationId"
                  value={notification.id}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      className="eyebrow"
                      style={{ margin: 0, fontSize: "0.62rem" }}
                    >
                      {notification.type.replace(/_/g, " ")}
                    </span>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      ·{" "}
                      {new Date(notification.created_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      color: "var(--color-text)",
                    }}
                  >
                    <strong>
                      {notification.actor_name ?? "LAFZOON Editorial"}
                    </strong>{" "}
                    {notification.type === "new_follower"
                      ? "is now following your publications."
                      : notification.work_title
                        ? `interacted with your piece "${notification.work_title}".`
                        : "interacted with your writing."}
                  </p>
                </div>
                <div>
                  <button
                    className={`button button-sm ${isUnread ? "" : "button-secondary"}`}
                    type="submit"
                    style={{ minWidth: "90px" }}
                  >
                    {isUnread ? "Mark read" : "Read ✓"}
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
