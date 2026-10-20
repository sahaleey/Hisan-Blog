import { sql } from "@vercel/postgres";

export default async function AdminActivityPage() {
  const result = await sql`
    SELECT l.action, l.target_type, l.target_id, l.metadata, l.created_at,
           a.display_name AS actor
    FROM audit_logs l LEFT JOIN authors a ON a.id = l.actor_id
    ORDER BY l.created_at DESC LIMIT 200
  `;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>05 / Audit Trail</span>
        <span>{result.rows.length} Historical Records</span>
      </div>
      <h2 className="display admin-title">A record of editorial decisions.</h2>

      <div className="admin-table">
        <div className="admin-table-head">
          <span>Action & Target</span>
          <span>Initiated By</span>
          <span>Timestamp</span>
        </div>
        {result.rows.length === 0 ? (
          <div className="dashboard-empty" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p className="muted" style={{ margin: 0 }}>
              No audit logs recorded yet.
            </p>
          </div>
        ) : (
          result.rows.map((entry) => (
            <div
              className="admin-table-row"
              key={`${entry.action}-${entry.created_at}`}
            >
              <span>
                <strong>{entry.action}</strong>
                <small>
                  Target: {entry.target_type} · ID: {entry.target_id}
                </small>
              </span>
              <span>
                <strong style={{ fontWeight: 500 }}>
                  {entry.actor ?? "System / Former account"}
                </strong>
              </span>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {new Date(entry.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
