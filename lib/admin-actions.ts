"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { requireAdminAccess, writeAuditLog } from "@/lib/admin";

const actionSchema = z.object({
  workId: z.string().uuid(),
  feedback: z.string().trim().max(2000).optional(),
});

export async function reviewWork(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess(["editor", "admin"]);
  const parsed = actionSchema.safeParse({
    workId: formData.get("workId"),
    feedback: formData.get("feedback") || undefined,
  });
  const nextStatus = formData.get("status");
  if (!parsed.success || !["published", "rejected", "draft"].includes(String(nextStatus))) {
    redirect("/admin/submissions?error=invalid-action");
  }
  if (["published", "rejected", "draft"].includes(String(nextStatus)) &&
      ["rejected", "draft"].includes(String(nextStatus)) &&
      !parsed.data.feedback) {
    redirect(`/admin/submissions/${parsed.data.workId}?error=feedback-required`);
  }

  const result = await sql<{ status: string }>`
    UPDATE works
    SET status = ${String(nextStatus)}::work_status,
        published_at = CASE WHEN ${String(nextStatus)} = 'published' THEN COALESCE(published_at, now()) ELSE NULL END,
        editorial_feedback = ${parsed.data.feedback ?? null},
        reviewed_at = now(),
        reviewed_by = ${actor.id},
        updated_at = now()
    WHERE id = ${parsed.data.workId}
      AND status IN ('submitted', 'published', 'rejected', 'draft')
    RETURNING status
  `;
  if (!result.rows[0]) redirect("/admin/submissions?error=work-not-found");

  await writeAuditLog(actor.id, `work_${nextStatus}`, "work", parsed.data.workId, {
    feedback: parsed.data.feedback ?? null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/archive");
  redirect(`/admin/submissions/${parsed.data.workId}?updated=${nextStatus}`);
}

const writerSchema = z.object({
  authorId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export async function updateWriterStatus(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess(["admin"]);
  const authorId = formData.get("authorId");
  const nextStatus = String(formData.get("status") || "");
  const parsed = writerSchema.safeParse({ authorId, reason: formData.get("reason") || undefined });
  if (!parsed.success || !["active", "suspended", "blocked"].includes(nextStatus)) {
    redirect("/admin/writers?error=invalid-status");
  }
  if (parsed.data.authorId === actor.id) {
    redirect("/admin/writers?error=self-status");
  }

  const result = await sql`
    UPDATE authors
    SET status = ${nextStatus}::account_status,
        moderation_reason = ${parsed.data.reason ?? null},
        updated_at = now()
    WHERE id = ${parsed.data.authorId}
    RETURNING id
  `;
  if (!result.rows[0]) redirect("/admin/writers?error=writer-not-found");
  await writeAuditLog(actor.id, `writer_${nextStatus}`, "author", parsed.data.authorId, {
    reason: parsed.data.reason ?? null,
  });
  revalidatePath("/admin/writers");
  redirect(`/admin/writers/${parsed.data.authorId}?updated=${nextStatus}`);
}

export async function updateWriterVerification(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess(["admin"]);
  const authorId = String(formData.get("authorId") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 1000);
  const verified = formData.get("verified") === "true";
  if (!z.string().uuid().safeParse(authorId).success || authorId === actor.id) {
    redirect("/admin/writers?error=invalid-writer");
  }

  await sql`
    UPDATE authors
    SET verified_at = ${verified ? new Date().toISOString() : null},
        verified_by = ${verified ? actor.id : null},
        verification_note = ${verified ? note || null : null},
        updated_at = now()
    WHERE id = ${authorId}
  `;
  await writeAuditLog(actor.id, verified ? "writer_verified" : "writer_unverified", "author", authorId, { note });
  revalidatePath("/admin/writers");
  revalidatePath("/authors");
  redirect(`/admin/writers/${authorId}?updated=verification`);
}

export async function updateWriterRole(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess(["admin"]);
  const authorId = String(formData.get("authorId") || "");
  const role = String(formData.get("role") || "");
  if (!z.string().uuid().safeParse(authorId).success || authorId === actor.id ||
      !["author", "editor", "moderator", "admin"].includes(role)) {
    redirect("/admin/writers?error=invalid-role");
  }
  if (role === "author") {
    const admins = await sql`SELECT COUNT(*)::int AS count FROM authors WHERE role = 'admin' AND status = 'active'`;
    const target = await sql`SELECT role FROM authors WHERE id = ${authorId}`;
    if (target.rows[0]?.role === "admin" && admins.rows[0].count <= 1) {
      redirect(`/admin/writers/${authorId}?error=last-admin`);
    }
  }
  await sql`UPDATE authors SET role = ${role}::account_role, updated_at = now() WHERE id = ${authorId}`;
  await writeAuditLog(actor.id, "writer_role_changed", "author", authorId, { role });
  revalidatePath("/admin/writers");
  redirect(`/admin/writers/${authorId}?updated=role`);
}

export async function updateReport(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess(["moderator", "admin"]);
  const reportId = String(formData.get("reportId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 2000);
  if (!z.string().uuid().safeParse(reportId).success || !["reviewing", "resolved", "dismissed"].includes(status)) {
    redirect("/admin/reports?error=invalid-report");
  }
  await sql`
    UPDATE reports
    SET status = ${status},
        moderator_id = ${actor.id},
        moderator_note = ${note || null},
        resolved_at = CASE WHEN ${status} IN ('resolved', 'dismissed') THEN now() ELSE NULL END
    WHERE id = ${reportId}
  `;
  await writeAuditLog(actor.id, `report_${status}`, "report", reportId, { note });
  revalidatePath("/admin/reports");
  redirect("/admin/reports?updated=1");
}
