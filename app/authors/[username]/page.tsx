import Link from "next/link";
import { ArticleGrid } from "@/components/article-grid";
import { withImageUrls } from "@/lib/article-images";
import type { JournalWork } from "@/lib/reader";
import { notFound } from "next/navigation";
import { sql } from "@vercel/postgres";

type AuthorPageProps = { params: Promise<{ username: string }> };

export default async function AuthorPage({ params }: AuthorPageProps) {
  if (!process.env.POSTGRES_URL) {
    return <AuthorEmptyState />;
  }

  const { username } = await params;
  const result = await sql`
    SELECT
      a.username,
      a.display_name AS "displayName",
      p.bio,
      p.languages,
      p.location,
      ((to_jsonb(a)->>'verified_at') IS NOT NULL) AS verified,
      COUNT(DISTINCT w.id)::int AS "workCount",
      COUNT(DISTINCT f.follower_id)::int AS "followerCount"
    FROM authors a
    LEFT JOIN author_profiles p ON p.author_id = a.id
    LEFT JOIN works w ON w.author_id = a.id AND w.status = 'published'
    LEFT JOIN follows f ON f.following_id = a.id
    WHERE lower(a.username) = lower(${username}) AND a.status = 'active'
    GROUP BY a.id, a.username, a.display_name, p.bio, p.languages, p.location
  `;

  const author = result.rows[0];
  if (!author) notFound();

  const works = await sql`
    SELECT w.id, w.title, w.slug, w.language, w.genre, w.excerpt, w.published_at,
      a.username AS author_username, a.display_name AS author_name,
      false AS author_verified, 0::int AS like_count, 0::int AS view_count,
      ai.object_key AS image_key, ai.alt_text AS image_alt
    FROM works w
    LEFT JOIN article_images ai ON ai.work_id = w.id
    JOIN authors a ON a.id = w.author_id
    WHERE w.author_id = (SELECT id FROM authors WHERE lower(username) = lower(${username}))
      AND w.status = 'published'
    ORDER BY w.published_at DESC
  `;
  const authorWorks = await withImageUrls(works.rows as JournalWork[]);
  const initial = author.displayName?.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="archive-page">
      <div
        style={{
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-accent)",
            color: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-serif)",
            fontSize: "2.4rem",
            fontWeight: 600,
            flexShrink: 0,
            boxShadow: "var(--shadow-card)",
          }}
        >
          {initial}
        </div>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 0.35rem" }}>
            Author Profile
          </p>
          <h1
            className="display"
            style={{
              fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {author.displayName}
            {author.verified ? (
              <span
                className="verified-badge"
                title="Verified LAFZOON writer"
                aria-label="Verified LAFZOON writer"
                style={{ fontSize: "0.7em" }}
              >
                ✓
              </span>
            ) : null}
          </h1>
          <p
            className="muted"
            style={{ margin: "0.4rem 0 1rem", fontSize: "0.85rem" }}
          >
            @{author.username} · {author.workCount}{" "}
            {author.workCount === 1 ? "published work" : "published works"} ·{" "}
            {author.followerCount}{" "}
            {author.followerCount === 1
              ? "reader following"
              : "readers following"}
            {author.location ? ` · ${author.location}` : ""}
          </p>
          {author.bio ? <p className="profile-bio">{author.bio}</p> : null}
        </div>
      </div>

      <div className="section-rule" style={{ marginTop: "4.5rem" }}>
        <span>Published Works</span>
        <span>{author.languages?.join(" · ") || "All Languages"}</span>
      </div>

      {authorWorks.length === 0 ? (
        <div className="empty-editorial" style={{ margin: "2rem 0" }}>
          <p className="eyebrow">Author Catalogue</p>
          <h2 className="display">No published works yet.</h2>
          <p>
            This writer&apos;s upcoming manuscripts are currently in review or
            preparation.
          </p>
          <Link className="text-link" href="/journal">
            Browse the wider journal ↗
          </Link>
        </div>
      ) : (
        <ArticleGrid works={authorWorks} />
      )}
    </div>
  );
}

function AuthorEmptyState() {
  return (
    <div className="archive-page">
      <div className="section-rule">
        <span>04 / Author Profile</span>
        <span>Awaiting Database Connection</span>
      </div>
      <div className="empty-editorial">
        <p className="eyebrow">Database Notice</p>
        <h1 className="display">The writer&apos;s page is waiting.</h1>
        <p className="muted">
          Connect PostgreSQL to browse public author profiles and verified
          student catalogues.
        </p>
        <Link className="text-link" href="/authors">
          Browse the community directory&nbsp; ↗
        </Link>
      </div>
    </div>
  );
}
