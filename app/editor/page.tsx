import Link from "next/link";
import { sql } from "@vercel/postgres";

export default async function EditorPage() {
  const result = await sql`
    SELECT w.id, w.title, w.language, w.genre, w.status, w.submitted_at,
           a.display_name AS author_name
    FROM works w JOIN authors a ON a.id = w.author_id
    WHERE w.status IN ('submitted', 'draft')
    ORDER BY w.submitted_at DESC NULLS LAST, w.created_at DESC
    LIMIT 100
  `;

  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>Editorial Queue</span>
        <span>{result.rows.length} Awaiting Assessment</span>
      </div>
      <h2 className="display admin-title">Read before publication.</h2>

      {result.rows.length === 0 ? (
        <div className="empty-editorial" style={{ margin: "2rem 0" }}>
          <p className="eyebrow">Desk Status</p>
          <h2 className="display">The editorial queue is clear.</h2>
          <p>No new manuscripts are currently awaiting peer or editorial review.</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-head">
            <span>Manuscript & Genre</span>
            <span>Writer</span>
            <span>Status & Action</span>
          </div>
          {result.rows.map((work) => (
            <Link className="admin-table-row" href={`/editor/${work.id}`} key={work.id}>
              <span>
                <strong>{work.title}</strong>
                <small>
                  {work.language} · {work.genre}
                </small>
              </span>
              <span>
                <strong>{work.author_name}</strong>
              </span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={`status-${work.status}`}>{work.status}</span>
                <span className="text-link" style={{ fontSize: "0.7rem" }}>
                  Review ↗
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
