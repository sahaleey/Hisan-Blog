import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { reviewWork } from "@/lib/admin-actions";

export default async function AdminSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await sql`
    SELECT w.*, a.display_name AS author_name, a.username, a.email
    FROM works w JOIN authors a ON a.id = w.author_id WHERE w.id = ${id} LIMIT 1
  `;
  const work = result.rows[0];
  if (!work) notFound();

  const rtl = work.language === "Arabic" || work.language === "Urdu";

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/submissions" className="text-link" style={{ fontSize: "0.75rem" }}>
          ← Back to submissions queue
        </Link>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
        <span className={`status-${work.status}`}>Status: {work.status}</span>
        <span className="eyebrow" style={{ margin: 0 }}>
          {work.language} · {work.genre}
        </span>
      </div>

      <h2 className="display admin-title" style={{ margin: "0.25rem 0 0.5rem" }}>
        {work.title}
      </h2>

      <p className="muted" style={{ margin: "0 0 2rem", fontSize: "0.9rem" }}>
        Submitted by <strong>{work.author_name}</strong> (@{work.username} · {work.email})
        {work.submitted_at
          ? ` on ${new Date(work.submitted_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`
          : ""}
      </p>

      {work.excerpt ? (
        <div className="admin-excerpt" dir={rtl ? "rtl" : "ltr"}>
          &ldquo;{work.excerpt}&rdquo;
        </div>
      ) : null}

      <article
        className={`admin-work-content ${rtl ? "rtl" : ""}`}
        lang={work.language.toLowerCase()}
        dir={rtl ? "rtl" : "ltr"}
      >
        {work.content}
      </article>

      <form className="admin-action-form" action={reviewWork}>
        <input type="hidden" name="workId" value={work.id} />
        <label htmlFor="feedback">Editorial Feedback & Reasoning</label>
        <textarea
          id="feedback"
          name="feedback"
          defaultValue={work.editorial_feedback ?? ""}
          maxLength={2000}
          placeholder="Provide an editorial assessment, guidance for revisions, or note for the author…"
        />
        <div className="admin-actions">
          <button className="button" name="status" value="published">
            ✓ Approve & Publish to Archive
          </button>
          <button className="button button-secondary" name="status" value="draft">
            ✎ Request Revisions
          </button>
          <button className="button button-danger" name="status" value="rejected">
            ✕ Reject Manuscript
          </button>
        </div>
      </form>
    </>
  );
}
