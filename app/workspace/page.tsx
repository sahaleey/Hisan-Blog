import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function WorkspacePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin?callbackUrl=%2Fworkspace");
  const params = await searchParams;
  const status = ["draft", "submitted", "published", "rejected"].includes(
    params.status ?? "",
  )
    ? params.status
    : null;
  const search = params.q?.trim() || null;
  const authorId = session.user.id;

  const [metricsResult, worksResult] = await Promise.all([
    sql`
  SELECT
    a.username,

    (
      SELECT COUNT(*)::int
      FROM works w
      WHERE w.author_id = a.id
        AND w.status = 'published'
    ) AS published_works,

    (
      SELECT COUNT(*)::int
      FROM work_views v
      INNER JOIN works w ON w.id = v.work_id
      WHERE w.author_id = a.id
        AND w.status = 'published'
    ) AS total_views,

    (
      SELECT COUNT(*)::int
      FROM likes l
      INNER JOIN works w ON w.id = l.work_id
      WHERE w.author_id = a.id
        AND w.status = 'published'
    ) AS total_likes,

    (
      SELECT COUNT(*)::int
      FROM follows f
      WHERE f.following_id = a.id
    ) AS followers,

    (
      SELECT COUNT(*)::int
      FROM follows f
      WHERE f.follower_id = a.id
    ) AS following,

    (
      SELECT COUNT(*)::int
      FROM comments c
      INNER JOIN works w ON w.id = c.work_id
      WHERE w.author_id = a.id
        AND w.status = 'published'
        AND c.status = 'visible'
    ) AS comments_received

  FROM authors a
  WHERE a.id = ${authorId}
`,

    sql`
      SELECT w.id, w.slug, w.title, w.status, w.language, w.genre, w.submitted_at, w.updated_at, w.published_at,
        COUNT(DISTINCT v.id)::int AS views, COUNT(DISTINCT l.author_id)::int AS likes,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'visible')::int AS comments
      FROM works w
      LEFT JOIN work_views v ON v.work_id = w.id
      LEFT JOIN likes l ON l.work_id = w.id
      LEFT JOIN comments c ON c.work_id = w.id
      WHERE w.author_id = ${authorId}
        AND (${status}::work_status IS NULL OR w.status = ${status}::work_status)
        AND (${search}::text IS NULL OR w.title ILIKE '%' || ${search} || '%' OR w.genre ILIKE '%' || ${search} || '%')
      GROUP BY w.id
      ORDER BY COALESCE(w.published_at, w.updated_at, w.submitted_at, w.created_at) DESC
      LIMIT 100
    `,
  ]);
  const metrics = metricsResult.rows[0] ?? {};
  const works = worksResult.rows;
  const name = session.user.name?.trim() || "Writer";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase() || "W";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-identity">
          <span className="dashboard-avatar">{initials}</span>
          <div>
            <p className="eyebrow">Author Workspace</p>
            <h1 className="display" style={{ margin: "0.2rem 0 0.5rem" }}>
              Welcome back, {name}.
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
              A calm desk to craft, edit, and track your writing before and after editorial review.
            </p>
          </div>
        </div>
        <div className="dashboard-actions">
          <Link className="button" href="/submit">
            Write an article ↗
          </Link>
          {metrics.username ? (
            <Link
              className="button button-secondary"
              href={`/authors/${metrics.username}`}
            >
              View public profile
            </Link>
          ) : null}
        </div>
      </header>

      <section className="stats-grid" aria-label="Writing statistics">
        {[
          ["Published works", metrics.published_works ?? 0],
          ["Total views", metrics.total_views ?? 0],
          ["Likes received", metrics.total_likes ?? 0],
          ["Followers", metrics.followers ?? 0],
          ["Following", metrics.following ?? 0],
          ["Comments", metrics.comments_received ?? 0],
        ].map(([label, value]) => (
          <div className="stat-card" key={label as string}>
            <p className="eyebrow">{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="section-rule">
          <span>Top-Performing Works</span>
          <span>By Reader Engagement</span>
        </div>
        <div className="dashboard-top-list">
          {works
            .filter((work) => work.status === "published")
            .sort((a, b) => Number(b.views) - Number(a.views))
            .slice(0, 5)
            .map((work) => (
              <article className="dashboard-work" key={work.id}>
                <div>
                  <p className="eyebrow" style={{ margin: "0 0 0.25rem", fontSize: "0.62rem" }}>
                    {work.language} ·{" "}
                    {work.published_at
                      ? new Date(work.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Published"}
                  </p>
                  <h2>
                    <Link href={`/journal/${work.slug}`}>{work.title}</Link>
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <span className="muted" style={{ fontSize: "0.85rem" }}>
                    {work.views} views · {work.likes} likes · {work.comments} comments
                  </span>
                  <Link
                    href={`/journal/${work.slug}`}
                    className="button button-secondary button-sm"
                  >
                    Read piece ↗
                  </Link>
                </div>
              </article>
            ))}
          {works.filter((work) => work.status === "published").length === 0 ? (
            <p className="muted dashboard-empty">
              Publish your first article to see readership analytics here.
            </p>
          ) : null}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-rule">
          <span>My Manuscripts</span>
          <span>{works.length} {works.length === 1 ? "work" : "works"} catalogued</span>
        </div>

        <form className="dashboard-filters" method="get">
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="Search within your manuscripts…"
            aria-label="Search your writing"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="button button-secondary" type="submit">
            Filter
          </button>
          {search || status ? (
            <Link href="/workspace" className="text-link" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
              Clear filter
            </Link>
          ) : null}
        </form>

        <div className="dashboard-writing-list">
          {works.length === 0 ? (
            <div className="dashboard-empty" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p className="muted" style={{ margin: "0 0 1rem" }}>
                No manuscripts match this filter.
              </p>
              <Link className="button" href="/submit">
                Write a new piece ↗
              </Link>
            </div>
          ) : (
            works.map((work) => (
              <article className="dashboard-work" key={work.id}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span className={`status-${work.status}`}>{work.status}</span>
                    <span className="eyebrow" style={{ margin: 0, fontSize: "0.65rem" }}>
                      {work.language} · {work.genre}
                    </span>
                  </div>
                  <h2>
                    {work.status === "published" ? (
                      <Link href={`/journal/${work.slug}`}>{work.title}</Link>
                    ) : (
                      work.title
                    )}
                  </h2>
                  <p className="muted" style={{ fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
                    Last updated{" "}
                    {new Date(work.updated_at ?? work.submitted_at).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <span className="muted" style={{ fontSize: "0.82rem" }}>
                    {work.status === "published"
                      ? `${work.views} views · ${work.likes} likes`
                      : "In editorial queue"}
                  </span>
                  {work.status === "published" ? (
                    <Link
                      href={`/journal/${work.slug}`}
                      className="button button-secondary button-sm"
                    >
                      View ↗
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
