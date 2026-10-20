import { sql } from "@vercel/postgres";

export async function getPublishedWorks() {
  if (!process.env.POSTGRES_URL) {
    return [];
  }

  const result = await sql`
    SELECT
      w.id,
      w.title,
      a.display_name AS author_name,
      a.username AS author_username,
      ((to_jsonb(a)->>'verified_at') IS NOT NULL) AS author_verified,
      w.language,
      w.excerpt,
      w.published_at
    FROM works w
    JOIN authors a ON a.id = w.author_id AND a.status = 'active'
    WHERE w.status = 'published'
    ORDER BY w.published_at DESC
    LIMIT 48
  `;
  return result.rows;
}
