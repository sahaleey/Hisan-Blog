import { sql } from "@vercel/postgres";

export type PublicAuthor = {
  username: string;
  displayName: string;
  bio: string | null;
  languages: string[];
  publishedWorkCount: number;
  followerCount: number;
  verified: boolean;
};

export async function getPublicAuthors(query?: string, language?: string) {
  if (!process.env.POSTGRES_URL) return [];

  const search = query?.trim() || null;
  const selectedLanguage = language?.trim() || null;
  const result = await sql<PublicAuthor>`
    SELECT
      a.username,
      a.display_name AS "displayName",
      p.bio,
      COALESCE(p.languages, '{}') AS languages,
      COUNT(DISTINCT w.id)::int AS "publishedWorkCount",
      COUNT(DISTINCT f.follower_id)::int AS "followerCount"
      ,((to_jsonb(a)->>'verified_at') IS NOT NULL) AS verified
    FROM authors a
    LEFT JOIN author_profiles p ON p.author_id = a.id
    LEFT JOIN works w ON w.author_id = a.id AND w.status = 'published'
    LEFT JOIN follows f ON f.following_id = a.id
    WHERE a.status = 'active'
      AND (${search}::text IS NULL OR a.username ILIKE '%' || ${search} || '%' OR a.display_name ILIKE '%' || ${search} || '%')
      AND (${selectedLanguage}::text IS NULL OR ${selectedLanguage} = ANY(COALESCE(p.languages, '{}')))
    GROUP BY a.id, a.username, a.display_name, p.bio, p.languages
    HAVING COUNT(DISTINCT w.id) > 0
    ORDER BY MAX(w.published_at) DESC NULLS LAST, a.display_name ASC
    LIMIT 24
  `;
  return result.rows;
}
