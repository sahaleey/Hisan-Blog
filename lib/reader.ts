import { sql } from "@vercel/postgres";
import { isRichTextDocument } from "@/lib/rich-text";
import { withImageUrls } from "@/lib/article-images";

export const PAGE_SIZE = 12;

export type JournalWork = {
  id: string;
  author_id?: string;
  slug: string;
  title: string;
  excerpt: string | null;
  language: string;
  genre: string;
  published_at: string;
  author_username: string;
  author_name: string;
  author_verified: boolean;
  like_count: number;
  view_count: number;
  content?: string;
  content_json?: unknown;
  image_id?: string;
  image_key?: string;
  image_alt?: string;
  image_caption?: string | null;
  image_url?: string;
};

export type PublicComment = {
  id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  username: string;
  display_name: string;
  verified: boolean;
};

export type JournalFilters = {
  language?: string;
  genre?: string;
  search?: string;
  sort?: "newest" | "popular";
  cursor?: string;
  year?: string;
  month?: string;
};

export async function getJournalWorks(filters: JournalFilters = {}) {
  const language = filters.language?.trim() || null;
  const genre = filters.genre?.trim() || null;
  const search = filters.search?.trim() || null;
  const year = filters.year?.trim() || null;
  const month = filters.month?.trim() || null;
  const sort = filters.sort === "popular" ? "popular" : "newest";
  const [cursorPublishedAt, cursorId] = filters.cursor?.split("|") ?? [];

  const result = await sql`
  SELECT
    w.id,
    w.slug,
    w.title,
    w.excerpt,
    w.language,
    w.genre,
    w.published_at,
    a.username AS author_username,
    a.display_name AS author_name,
    ((to_jsonb(a)->>'verified_at') IS NOT NULL) AS author_verified,
    COALESCE(lc.like_count, 0)::int AS like_count,
    COALESCE(vc.view_count, 0)::int AS view_count,
    ai.id AS image_id,
    ai.object_key AS image_key,
    ai.alt_text AS image_alt,
    ai.caption AS image_caption
  FROM works w
  JOIN authors a
    ON a.id = w.author_id
    AND a.status = 'active'
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS like_count
    FROM likes l
    WHERE l.work_id = w.id
  ) lc ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS view_count
    FROM work_views v
    WHERE v.work_id = w.id
  ) vc ON TRUE
  LEFT JOIN LATERAL (
    SELECT img.id, img.object_key, img.alt_text, img.caption
    FROM article_images img
    WHERE img.work_id = w.id
    ORDER BY img.created_at DESC NULLS LAST, img.id DESC
    LIMIT 1
  ) ai ON TRUE
  WHERE w.status = 'published'
    AND (${language}::text IS NULL OR w.language = ${language})
    AND (${genre}::text IS NULL OR w.genre = ${genre})
    AND (${year}::text IS NULL OR EXTRACT(YEAR FROM w.published_at) = ${year}::int)
    AND (${month}::text IS NULL OR EXTRACT(MONTH FROM w.published_at) = ${month}::int)
    AND (
      ${search}::text IS NULL OR
      w.title ILIKE '%' || ${search} || '%' OR
      COALESCE(w.excerpt, '') ILIKE '%' || ${search} || '%' OR
      a.display_name ILIKE '%' || ${search} || '%' OR
      a.username ILIKE '%' || ${search} || '%'
    )
    AND (
      ${cursorPublishedAt ?? null}::timestamptz IS NULL OR
      (w.published_at, w.id) <
      (${cursorPublishedAt ?? null}::timestamptz, ${cursorId ?? null}::uuid)
    )
  ORDER BY
    CASE
      WHEN ${sort} = 'popular' THEN COALESCE(vc.view_count, 0)
      ELSE 0
    END DESC,
    w.published_at DESC,
    w.id DESC
  LIMIT ${PAGE_SIZE + 1}
`;

  const rows = await withImageUrls(result.rows as JournalWork[]);
  const hasMore = rows.length > PAGE_SIZE;
  const works = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  return {
    works,
    nextCursor: hasMore
      ? `${works[works.length - 1]?.published_at ?? ""}|${works[works.length - 1]?.id ?? ""}`
      : null,
    hasMore,
  };
}

export async function getPublishedWork(slug: string) {
  const result = await sql`
  SELECT
    w.id,
    w.slug,
    w.title,
    w.excerpt,
    w.content,
    w.content_json,
    w.language,
    w.genre,
    w.published_at,
    w.author_id,
    a.username,
    a.display_name,
    COALESCE(lc.like_count, 0)::int AS like_count,
    COALESCE(vc.view_count, 0)::int AS view_count,
    ai.id AS image_id,
    ai.object_key AS image_key,
    ai.alt_text AS image_alt,
    ai.caption AS image_caption
  FROM works w
  JOIN authors a
    ON a.id = w.author_id
   AND a.status = 'active'
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS like_count
    FROM likes l
    WHERE l.work_id = w.id
  ) lc ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS view_count
    FROM work_views v
    WHERE v.work_id = w.id
  ) vc ON TRUE
  LEFT JOIN LATERAL (
    SELECT img.id, img.object_key, img.alt_text, img.caption
    FROM article_images img
    WHERE img.work_id = w.id
    ORDER BY img.created_at DESC NULLS LAST, img.id DESC
    LIMIT 1
  ) ai ON TRUE
  WHERE w.slug = ${slug}
    AND w.status = 'published'
  LIMIT 1
`;
  const work = result.rows[0] as JournalWork | undefined;
  if (work?.image_key)
    work.image_url = `/api/assets/${work.image_key.split("/").map(encodeURIComponent).join("/")}`;
  if (work && !isRichTextDocument(work.content_json)) delete work.content_json;
  return work ?? null;
}

export async function getHomeWorks() {
  const result = await sql`
    SELECT
      w.id,
      w.slug,
      w.title,
      w.excerpt,
      w.language,
      w.genre,
      w.published_at,
      a.username AS author_username,
      a.display_name AS author_name,
      ((to_jsonb(a)->>'verified_at') IS NOT NULL) AS author_verified,
      COALESCE(vc.view_count, 0)::int AS view_count,
      ai.id AS image_id,
      ai.object_key AS image_key,
      ai.alt_text AS image_alt,
      ai.caption AS image_caption
    FROM works w
    JOIN authors a
      ON a.id = w.author_id
      AND a.status = 'active'
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS view_count
      FROM work_views v
      WHERE v.work_id = w.id
    ) vc ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        img.id,
        img.object_key,
        img.alt_text,
        img.caption
      FROM article_images img
      WHERE img.work_id = w.id
      ORDER BY img.created_at DESC NULLS LAST, img.id DESC
      LIMIT 1
    ) ai ON TRUE
    WHERE w.status = 'published'
    ORDER BY
      w.featured_at DESC NULLS LAST,
      COALESCE(vc.view_count, 0) DESC,
      w.published_at DESC,
      w.id DESC
    LIMIT 4
  `;

  const popular = await sql`
    SELECT
      w.id,
      w.slug,
      w.title,
      w.excerpt,
      w.language,
      w.genre,
      w.published_at,
      a.username AS author_username,
      a.display_name AS author_name,
      ((to_jsonb(a)->>'verified_at') IS NOT NULL) AS author_verified,
      COALESCE(vc.view_count, 0)::int AS view_count
    FROM works w
    JOIN authors a
      ON a.id = w.author_id
      AND a.status = 'active'
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS view_count
      FROM work_views v
      WHERE v.work_id = w.id
        AND v.created_at > now() - interval '30 days'
    ) vc ON TRUE
    WHERE w.status = 'published'
    ORDER BY
      COALESCE(vc.view_count, 0) DESC,
      w.published_at DESC,
      w.id DESC
    LIMIT 6
  `;

  return {
    featured: await withImageUrls(result.rows as JournalWork[]),
    popular: await withImageUrls(popular.rows as JournalWork[]),
  };
}

export async function getComments(workId: string) {
  const result = await sql`
    SELECT c.id, c.author_id, c.parent_id, c.body, c.created_at, c.edited_at,
           a.username, a.display_name,
           ((to_jsonb(a)->>'verified_at') IS NOT NULL) AS verified
    FROM comments c
    JOIN authors a ON a.id = c.author_id AND a.status = 'active'
    WHERE c.work_id = ${workId} AND c.status = 'visible'
    ORDER BY c.created_at ASC
    LIMIT 200
  `;
  return result.rows as PublicComment[];
}

export async function getWorkInteractionState(
  workId: string,
  authorId?: string,
) {
  if (!authorId) return { liked: false, following: false };
  const result = await sql`
    SELECT
      EXISTS (SELECT 1 FROM likes WHERE work_id = ${workId} AND author_id = ${authorId}) AS liked,
      EXISTS (SELECT 1 FROM follows f JOIN works w ON w.author_id = f.following_id
        WHERE f.follower_id = ${authorId} AND w.id = ${workId}) AS following
  `;
  return result.rows[0] ?? { liked: false, following: false };
}
