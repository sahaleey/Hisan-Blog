import Link from "next/link";
import { sql } from "@vercel/postgres";

export default async function AdminSubmissionsPage() {
  const result = await sql`
    SELECT w.id, w.title, w.language, w.genre, w.status, w.submitted_at,
           a.display_name AS author_name, a.username
    FROM works w
    JOIN authors a ON a.id = w.author_id
    WHERE w.status IN ('submitted', 'rejected', 'draft', 'published')
    ORDER BY CASE WHEN w.status = 'submitted' THEN 0 ELSE 1 END, w.submitted_at DESC NULLS LAST
    LIMIT 100
  `;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>02 / Editorial Queue</span>
        <span>{result.rows.length} Submissions Catalogued</span>
      </div>
      <h2 className="display admin-title">Read before it enters the archive.</h2>

      <div className="admin-table">
        <div className="admin-table-head">
          <span>Work & Genre</span>
          <span>Author</span>
          <span>Status & Action</span>
        </div>
        {result.rows.length === 0 ? (
          <div className="dashboard-empty" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p className="muted" style={{ margin: 0 }}>
              No manuscripts found in the editorial queue.
            </p>
          </div>
        ) : (
          result.rows.map((work) => (
            <Link
              className="admin-table-row"
              href={`/admin/submissions/${work.id}`}
              key={work.id}
            >
              <span>
                <strong>{work.title}</strong>
                <small>
                  {work.language} · {work.genre}
                </small>
              </span>
              <span>
                <strong>{work.author_name}</strong>
                <small>@{work.username}</small>
              </span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={`status-${work.status}`}>{work.status}</span>
                <span className="text-link" style={{ fontSize: "0.7rem" }}>
                  Review ↗
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
