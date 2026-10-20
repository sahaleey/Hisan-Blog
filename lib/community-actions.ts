"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/permissions";

const uuid = z.string().uuid();

async function publishedWork(workId: string) {
  const result = await sql<{ id: string; authorId: string }>`
    SELECT w.id, w.author_id AS "authorId"
    FROM works w
    JOIN authors a ON a.id = w.author_id AND a.status = 'active'
    WHERE w.id = ${workId} AND w.status = 'published'
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function toggleLike(workId: string) {
  const actor = await requireAuthenticatedUser();
  if (!uuid.safeParse(workId).success) return { ok: false, message: "Invalid work." };
  const work = await publishedWork(workId);
  if (!work) return { ok: false, message: "That work is not available." };

  const existing = await sql`SELECT 1 FROM likes WHERE author_id = ${actor.id} AND work_id = ${workId}`;
  if (existing.rowCount) {
    await sql`DELETE FROM likes WHERE author_id = ${actor.id} AND work_id = ${workId}`;
    revalidatePath(`/journal/${workId}`);
    return { ok: true, liked: false };
  }
  await sql`INSERT INTO likes (author_id, work_id) VALUES (${actor.id}, ${workId}) ON CONFLICT DO NOTHING`;
  if (work.authorId !== actor.id) {
    await sql`
      INSERT INTO notifications (recipient_id, actor_id, type, work_id)
      VALUES (${work.authorId}, ${actor.id}, 'like', ${workId})
    `;
  }
  revalidatePath(`/journal/${workId}`);
  return { ok: true, liked: true };
}

export async function toggleFollow(authorId: string) {
  const actor = await requireAuthenticatedUser();
  if (!uuid.safeParse(authorId).success || authorId === actor.id) {
    return { ok: false, message: "You cannot follow this writer." };
  }
  const target = await sql`SELECT id FROM authors WHERE id = ${authorId} AND status = 'active'`;
  if (!target.rowCount) return { ok: false, message: "That writer is not available." };
  const existing = await sql`
    SELECT 1 FROM follows WHERE follower_id = ${actor.id} AND following_id = ${authorId}
  `;
  if (existing.rowCount) {
    await sql`DELETE FROM follows WHERE follower_id = ${actor.id} AND following_id = ${authorId}`;
    return { ok: true, following: false };
  }
  await sql`
    INSERT INTO follows (follower_id, following_id)
    VALUES (${actor.id}, ${authorId})
    ON CONFLICT DO NOTHING
  `;
  await sql`
    INSERT INTO notifications (recipient_id, actor_id, type)
    VALUES (${authorId}, ${actor.id}, 'new_follower')
  `;
  return { ok: true, following: true };
}

export async function addComment(workId: string, body: string, parentId?: string) {
  const actor = await requireAuthenticatedUser();
  const parsed = z.object({
    workId: uuid,
    body: z.string().trim().min(1).max(2000),
    parentId: uuid.optional(),
  }).safeParse({ workId, body, parentId: parentId || undefined });
  if (!parsed.success) return { ok: false, message: "Write a comment of up to 2,000 characters." };
  const work = await publishedWork(parsed.data.workId);
  if (!work) return { ok: false, message: "That work is not available." };
  const result = await sql<{ id: string }>`
    INSERT INTO comments (work_id, author_id, body, parent_id)
    VALUES (${parsed.data.workId}, ${actor.id}, ${parsed.data.body}, ${parsed.data.parentId ?? null})
    RETURNING id
  `;
  if (work.authorId !== actor.id) {
    await sql`
      INSERT INTO notifications (recipient_id, actor_id, type, work_id, comment_id)
      VALUES (${work.authorId}, ${actor.id}, 'new_comment', ${parsed.data.workId}, ${result.rows[0].id})
    `;
  }
  revalidatePath(`/journal/${workId}`);
  return {
    ok: true,
    comment: {
      id: result.rows[0].id,
      author_id: actor.id,
      parent_id: parsed.data.parentId ?? null,
      body: parsed.data.body,
      created_at: new Date().toISOString(),
      edited_at: null,
      username: actor.id,
      display_name: "You",
      verified: false,
    },
  };
}

export async function deleteComment(commentId: string) {
  const actor = await requireAuthenticatedUser();
  if (!uuid.safeParse(commentId).success) return { ok: false };
  const result = await sql`
    UPDATE comments
    SET status = 'removed', updated_at = now()
    WHERE id = ${commentId} AND author_id = ${actor.id} AND status = 'visible'
    RETURNING work_id
  `;
  if (!result.rowCount) return { ok: false };
  revalidatePath(`/journal/${result.rows[0].work_id}`);
  return { ok: true };
}

export async function markNotificationRead(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  const notificationId = String(formData.get("notificationId") || "");
  if (!uuid.safeParse(notificationId).success) return;
  await sql`
    UPDATE notifications SET read_at = COALESCE(read_at, now())
    WHERE id = ${notificationId} AND recipient_id = ${actor.id}
  `;
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const actor = await requireAuthenticatedUser();
  await sql`UPDATE notifications SET read_at = now() WHERE recipient_id = ${actor.id} AND read_at IS NULL`;
  revalidatePath("/notifications");
}
