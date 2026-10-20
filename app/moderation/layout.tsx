import Link from "next/link";
import { requireRole } from "@/lib/permissions";

export default async function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await requireRole(["moderator", "admin"], "/moderation");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">LAFZOON / Safety</p>
        <h1
          className="display"
          style={{ fontSize: "2.2rem", margin: "0.4rem 0" }}
        >
          Moderation Desk
        </h1>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            marginTop: "0.25rem",
          }}
        >
          <span
            className="status-submitted"
            style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}
          >
            Role: {identity.role}
          </span>
        </div>

        <nav className="admin-nav" aria-label="Moderation navigation">
          <Link href="/moderation">Flagged Reports</Link>
          <Link href="/notifications">Safety Notifications</Link>
          <Link href="/workspace">My Workspace ↗</Link>
        </nav>
      </aside>
      <section className="admin-content">{children}</section>
    </div>
  );
}
