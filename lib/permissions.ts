import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type Role = "author" | "editor" | "moderator" | "admin";
export type ActiveStatus = "active" | "suspended" | "blocked" | "deactivated";

export async function requireAuthenticatedUser(callbackPath = "/workspace") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const result = await sql<{ id: string; role: Role; status: ActiveStatus }>`
    SELECT id, role, status
    FROM authors
    WHERE id = ${session.user.id}
    LIMIT 1
  `;
  const identity = result.rows[0];
  if (!identity || identity.status !== "active") {
    redirect("/?error=AccountNotActive");
  }
  return identity;
}

export async function requireRole(roles: readonly Role[], callbackPath: string) {
  const identity = await requireAuthenticatedUser();
  if (!roles.includes(identity.role)) {
    redirect(`/?error=AccessDenied&from=${encodeURIComponent(callbackPath)}`);
  }
  return identity;
}

export async function getPublicWorkIdentity(workId: string) {
  const result = await sql<{ id: string; authorId: string }>`
    SELECT w.id, w.author_id AS "authorId"
    FROM works w
    JOIN authors a ON a.id = w.author_id AND a.status = 'active'
    WHERE w.id = ${workId} AND w.status = 'published'
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}
