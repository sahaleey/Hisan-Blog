import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type AdminRole = "editor" | "moderator" | "admin";
export type AccountStatus = "active" | "suspended" | "blocked" | "deactivated";

export type AdminIdentity = {
  id: string;
  role: AdminRole;
  status: AccountStatus;
};

export async function requireAdminAccess(roles: AdminRole[] = ["editor", "moderator", "admin"]) {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin?callbackUrl=%2Fadmin");

  const result = await sql<AdminIdentity>`
    SELECT id, role, status
    FROM authors
    WHERE id = ${session.user.id}
    LIMIT 1
  `;
  const identity = result.rows[0];
  if (!identity || identity.status !== "active" || !roles.includes(identity.role)) {
    redirect("/?error=AdminAccessDenied");
  }
  return identity;
}

export async function getFreshAuthorStatus(authorId: string) {
  const result = await sql<{ status: AccountStatus; role: string }>`
    SELECT status, role FROM authors WHERE id = ${authorId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function writeAuditLog(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (${actorId}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(metadata)}::jsonb)
  `;
}
