import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const workId = request.nextUrl.searchParams.get("workId");
  if (!workId) return NextResponse.json({ ok: false }, { status: 400 });
  const session = await auth();
  const authorId = session?.user?.id || null;

  if (authorId) {
    const inserted = await sql`
      INSERT INTO work_views (work_id, author_id, viewer_key)
      SELECT w.id, ${authorId}, ${`auth:${authorId}`}
      FROM works w
      JOIN authors a ON a.id = w.author_id AND a.status = 'active'
      WHERE w.id = ${workId} AND w.status = 'published'
      ON CONFLICT (work_id, author_id) WHERE author_id IS NOT NULL DO NOTHING
      RETURNING id
    `;
    if (!inserted.rowCount) {
      const exists = await sql`SELECT 1 FROM works WHERE id = ${workId} AND status = 'published' LIMIT 1`;
      return NextResponse.json({ ok: Boolean(exists.rowCount), counted: false }, { status: exists.rowCount ? 200 : 404 });
    }
    return NextResponse.json({ ok: true, counted: true });
  }

  const existingKey = request.cookies.get("hisan_viewer")?.value;
  const viewerKey = existingKey || randomUUID();
  const work = await sql`
    SELECT works.id FROM works
    JOIN authors a ON a.id = works.author_id AND a.status = 'active'
    WHERE works.id = ${workId} AND works.status = 'published'
    LIMIT 1
  `;
  if (!work.rowCount) return NextResponse.json({ ok: false }, { status: 404 });
  const recent = await sql`
    SELECT 1 FROM work_views
    WHERE work_id = ${workId} AND viewer_key = ${viewerKey}
      AND created_at > now() - interval '24 hours'
    LIMIT 1
  `;
  if (!recent.rowCount) {
    await sql`INSERT INTO work_views (work_id, viewer_key) VALUES (${workId}, ${viewerKey})`;
  }
  const response = NextResponse.json({ ok: true, counted: !recent.rowCount });
  if (!existingKey) {
    response.cookies.set("hisan_viewer", viewerKey, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, path: "/",
    });
  }
  return response;
}
