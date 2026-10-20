import { sql } from "@vercel/postgres";
import { updateReport } from "@/lib/admin-actions";

export default async function ModerationPage() {
  const result = await sql`
    SELECT r.id, r.reason, r.status, r.created_at, a.display_name AS reporter,
           w.title AS work_title, c.body AS comment_body
    FROM reports r
    JOIN authors a ON a.id = r.reporter_id
    LEFT JOIN works w ON w.id = r.work_id
    LEFT JOIN comments c ON c.id = r.comment_id
    WHERE r.status IN ('open', 'reviewing')
    ORDER BY r.created_at DESC
    LIMIT 100
  `;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>Community Safety</span>
        <span>{result.rows.length} Open Reports</span>
      </div>
      <h2 className="display admin-title">Community standards review.</h2>

      {result.rows.length === 0 ? (
        <div className="empty-editorial" style={{ margin: "2rem 0" }}>
          <p className="eyebrow">Moderation Status</p>
          <h2 className="display">No pending community reports.</h2>
          <p>Reader comments and author submissions are in good standing.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem", marginTop: "1.5rem" }}>
          {result.rows.map((report) => (
            <form className="admin-report" action={updateReport} key={report.id}>
              <input type="hidden" name="reportId" value={report.id} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ fontSize: "1.15rem", color: "var(--color-text)" }}>
                    {report.work_title ? `Work: "${report.work_title}"` : "Comment Report"}
                  </strong>
                  <p style={{ marginTop: "0.5rem", fontStyle: "italic", color: "var(--color-text-secondary)" }}>
                    &ldquo;{report.comment_body ?? report.reason}&rdquo;
                  </p>
                </div>
                <span className="status-submitted">{report.status}</span>
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
                placeholder="Required moderation decision rationale…"
                maxLength={2000}
                required
                style={{ marginTop: "0.5rem" }}
              />

              <div className="admin-actions">
                <button className="button button-sm" name="status" value="resolved">
                  ✓ Resolve (Action Taken)
                </button>
                <button className="button button-danger button-sm" name="status" value="dismissed">
                  Dismiss (No Violation)
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </>
  );
}
