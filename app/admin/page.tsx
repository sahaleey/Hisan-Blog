import Link from "next/link";
import { sql } from "@vercel/postgres";

export default async function AdminPage() {
  const [authors, verified, pending, published, restricted, reports, recent] =
    await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM authors`,
      sql`SELECT COUNT(*)::int AS count FROM authors WHERE verified_at IS NOT NULL`,
      sql`SELECT COUNT(*)::int AS count FROM works WHERE status = 'submitted'`,
      sql`SELECT COUNT(*)::int AS count FROM works WHERE status = 'published'`,
      sql`SELECT COUNT(*)::int AS count FROM authors WHERE status IN ('suspended', 'blocked')`,
      sql`SELECT COUNT(*)::int AS count FROM reports WHERE status IN ('open', 'reviewing')`,
      sql`SELECT action, target_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8`,
    ]);

  const stats = [
    ["Registered Authors", authors.rows[0].count, "/admin/writers"],
    ["Verified Writers", verified.rows[0].count, "/admin/writers"],
    ["Awaiting Review", pending.rows[0].count, "/admin/submissions"],
    ["Published Works", published.rows[0].count, "/archive"],
    ["Restricted Accounts", restricted.rows[0].count, "/admin/writers"],
    ["Open Reports", reports.rows[0].count, "/admin/reports"],
  ] as const;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>01 / System Overview</span>
        <span>Administrative Metrics</span>
      </div>
      <h2 className="display admin-title">The journal at a glance.</h2>

      <div className="admin-stat-grid">
        {stats.map(([label, value, href]) => (
          <Link className="admin-stat" href={href} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </div>

      <div className="admin-columns">
        <section className="admin-panel">
          <div className="section-rule" style={{ borderTop: "none", padding: "0 0 1rem" }}>
            <span>Review Queue</span>
            <Link href="/admin/submissions">Open queue ↗</Link>
          </div>
          <p className="admin-callout">
            {pending.rows[0].count} submission(s) currently awaiting an editorial decision.
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link className="button button-sm" href="/admin/submissions">
              Review submissions now ↗
            </Link>
          </div>
        </section>

        <section className="admin-panel">
          <div className="section-rule" style={{ borderTop: "none", padding: "0 0 1rem" }}>
            <span>Recent Activity</span>
            <Link href="/admin/activity">Full audit log ↗</Link>
          </div>
          {recent.rows.length === 0 ? (
            <p className="muted" style={{ fontStyle: "italic", marginTop: "1rem" }}>
              No administrative activity recorded yet.
            </p>
          ) : (
            <div style={{ marginTop: "0.5rem" }}>
              {recent.rows.map((entry) => (
                <div
                  className="admin-log-line"
                  key={`${entry.action}-${entry.created_at}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>
                    <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>
                      {entry.action}
                    </strong>{" "}
                    · <span className="muted">{entry.target_type}</span>
                  </span>
                  <small className="muted">
                    {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
