import { sql } from "@vercel/postgres";
import { imageUrl } from "@/lib/storage";

export type ArticleImage = {
  image_id: string;
  image_key: string;
  image_alt: string;
  image_caption: string | null;
  image_url?: string;
};

export async function withImageUrls<T extends { image_key?: string | null }>(rows: T[]) {
  return Promise.all(rows.map(async (row) => ({
    ...row,
    image_url: row.image_key ? `/api/assets/${row.image_key.split("/").map(encodeURIComponent).join("/")}` : undefined,
  })));
}

export async function getArticleImage(workId: string) {
  const result = await sql<ArticleImage>`
    SELECT id AS image_id, object_key AS image_key, alt_text AS image_alt, caption AS image_caption
    FROM article_images WHERE work_id = ${workId} LIMIT 1
  `;
  const image = result.rows[0];
  return image ? { ...image, image_url: await imageUrl(image.image_key).catch(() => undefined) } : null;
}
