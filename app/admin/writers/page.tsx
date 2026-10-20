import Link from "next/link";
import { sql } from "@vercel/postgres";

export default async function AdminWritersPage() {
  const result = await sql`
    SELECT a.id, a.display_name, a.username, a.email, a.role, a.status, a.verified_at,
           COUNT(w.id)::int AS work_count
    FROM authors a LEFT JOIN works w ON w.author_id = a.id
    GROUP BY a.id ORDER BY a.created_at DESC
  `;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>03 / Writers Directory</span>
        <span>{result.rows.length} Authors Registered</span>
      </div>
      <h2 className="display admin-title">People behind the pages.</h2>

      <div className="admin-table">
        <div className="admin-table-head">
          <span>Writer & Handle</span>
          <span>Role</span>
          <span>Account Status & Verified</span>
        </div>
        {result.rows.map((writer) => {
          const initial = writer.display_name?.trim().charAt(0).toUpperCase() || "A";
          return (
            <Link
              className="admin-table-row"
              href={`/admin/writers/${writer.id}`}
              key={writer.id}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "var(--radius-xs)",
                    background: "var(--color-accent)",
                    color: "var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </span>
                <span>
                  <strong>{writer.display_name}</strong>
                  <small>
                    @{writer.username} · {writer.work_count} {writer.work_count === 1 ? "work" : "works"}
                  </small>
                </span>
              </span>
              <span>
                <span className="status-submitted" style={{ textTransform: "capitalize" }}>
                  {writer.role}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={`status-${writer.status}`}>
                  {writer.status}
                  {writer.verified_at ? " · verified ✓" : ""}
                </span>
                <span className="text-link" style={{ fontSize: "0.7rem" }}>
                  Edit ↗
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
