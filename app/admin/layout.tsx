import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await requireAdminAccess(["admin"]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">LAFZOON / Control Room</p>
        <h1
          className="display"
          style={{ fontSize: "2.2rem", margin: "0.4rem 0" }}
        >
          Editorial Desk
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
            className="status-published"
            style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}
          >
            Role: {identity.role}
          </span>
        </div>

        <nav className="admin-nav" aria-label="Administration navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/submissions">Submissions Queue</Link>
          <Link href="/admin/writers">Writers & Accounts</Link>
          <Link href="/admin/reports">Moderation Reports</Link>
          <Link href="/admin/activity">Audit Activity</Link>
          <Link href="/admin/settings">Settings & Boundaries</Link>
        </nav>

        <div
          style={{
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/workspace"
            className="text-link"
            style={{ fontSize: "0.72rem" }}
          >
            ← Writer workspace
          </Link>
        </div>
      </aside>
      <section className="admin-content">{children}</section>
    </div>
  );
}
