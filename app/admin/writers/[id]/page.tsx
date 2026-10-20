import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import {
  updateWriterRole,
  updateWriterStatus,
  updateWriterVerification,
} from "@/lib/admin-actions";

export default async function AdminWriterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await sql`SELECT * FROM authors WHERE id = ${id} LIMIT 1`;
  const writer = result.rows[0];
  if (!writer) notFound();

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/writers" className="text-link" style={{ fontSize: "0.75rem" }}>
          ← Back to writers directory
        </Link>
      </div>

      <p className="eyebrow">Author Record & Permissions</p>
      <h2 className="display admin-title" style={{ margin: "0.25rem 0 0.5rem" }}>
        {writer.display_name}
      </h2>
      <p className="muted" style={{ margin: "0 0 2.5rem", fontSize: "0.9rem" }}>
        @{writer.username} · {writer.email} · System Role: <strong>{writer.role}</strong>
        {writer.verified_at ? " · Verified Writer ✓" : ""}
      </p>

      <div className="admin-columns">
        <form className="admin-panel admin-action-form" action={updateWriterRole}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", margin: "0 0 0.5rem" }}>
            Role & Permissions
          </h3>
          <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 1rem" }}>
            Controls access to editor and moderation control rooms.
          </p>
          <input type="hidden" name="authorId" value={writer.id} />
          <label htmlFor="role">Assigned System Role</label>
          <select id="role" name="role" defaultValue={writer.role}>
            <option value="author">Author (Standard)</option>
            <option value="editor">Editor (Queue Reviewer)</option>
            <option value="moderator">Moderator (Safety & Reports)</option>
            <option value="admin">Administrator (Full Control)</option>
          </select>
          <button className="button" style={{ justifySelf: "start", marginTop: "0.5rem" }}>
            Save Role Changes
          </button>
        </form>

        <form className="admin-panel admin-action-form" action={updateWriterVerification}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", margin: "0 0 0.5rem" }}>
            Writer Verification
          </h3>
          <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 1rem" }}>
            Displays a verification badge (✓) on published works and author profile.
          </p>
          <input type="hidden" name="authorId" value={writer.id} />
          <label htmlFor="note">Internal Verification Note</label>
          <textarea
            id="note"
            name="note"
            defaultValue={writer.verification_note ?? ""}
            maxLength={1000}
            placeholder="Record reason or institutional credentials for verification…"
          />
          <button
            className={`button ${writer.verified_at ? "button-danger" : ""}`}
            name="verified"
            value={writer.verified_at ? "false" : "true"}
            style={{ justifySelf: "start", marginTop: "0.5rem" }}
          >
            {writer.verified_at ? "Revoke Verification" : "Verify Writer ✓"}
          </button>
        </form>

        <form className="admin-panel admin-action-form" action={updateWriterStatus} style={{ gridColumn: "span 2" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", margin: "0 0 0.5rem" }}>
            Account Standing & Safety
          </h3>
          <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 1rem" }}>
            Current account state: <strong className={`status-${writer.status}`}>{writer.status}</strong>
          </p>
          <input type="hidden" name="authorId" value={writer.id} />
          <label htmlFor="reason">Moderation Reason</label>
          <textarea
            id="reason"
            name="reason"
            defaultValue={writer.moderation_reason ?? ""}
            maxLength={500}
            placeholder="Specify reason for suspension, blocking, or restoration…"
          />
          <div className="admin-actions">
            <button className="button" name="status" value="active">
              ✓ Restore to Active Standing
            </button>
            <button className="button button-secondary" name="status" value="suspended">
              Suspend Account
            </button>
            <button className="button button-danger" name="status" value="blocked">
              Block Account
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
