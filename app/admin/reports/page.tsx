import { sql } from "@vercel/postgres";
import { updateReport } from "@/lib/admin-actions";

export default async function AdminReportsPage() {
  const result = await sql`
    SELECT r.id, r.reason, r.status, r.created_at, a.display_name AS reporter,
           w.title AS work_title
    FROM reports r JOIN authors a ON a.id = r.reporter_id
    LEFT JOIN works w ON w.id = r.work_id
    ORDER BY r.created_at DESC LIMIT 100
  `;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>04 / Moderation Queue</span>
        <span>{result.rows.length} Community Reports</span>
      </div>
      <h2 className="display admin-title">Reports deserve a response.</h2>

      {result.rows.length === 0 ? (
        <div className="empty-editorial" style={{ margin: "2rem 0" }}>
          <p className="eyebrow">Safety Status</p>
          <h2 className="display">The community queue is clear.</h2>
          <p>No community reports have been filed by readers or writers.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem", marginTop: "1.5rem" }}>
          {result.rows.map((report) => (
            <form className="admin-report" action={updateReport} key={report.id}>
              <input type="hidden" name="reportId" value={report.id} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ fontSize: "1.2rem", color: "var(--color-text)" }}>
                    {report.work_title ? `Report on: "${report.work_title}"` : "Community Profile Report"}
                  </strong>
                  <p style={{ marginTop: "0.4rem", fontSize: "0.95rem" }}>{report.reason}</p>
                </div>
                <span className={`status-${report.status}`}>{report.status}</span>
              </div>

              <small className="muted">
                Reported by {report.reporter} on{" "}
                {new Date(report.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </small>

              <input
                name="note"
                placeholder="Add an internal moderation note before resolving…"
                maxLength={2000}
                style={{ marginTop: "0.5rem" }}
              />

              <div className="admin-actions">
                <button className="button button-secondary button-sm" name="status" value="reviewing">
                  Mark Reviewing
                </button>
                <button className="button button-sm" name="status" value="resolved">
                  ✓ Resolve Report
                </button>
                <button className="button button-danger button-sm" name="status" value="dismissed">
                  Dismiss
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </>
  );
}
