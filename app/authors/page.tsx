import Link from "next/link";
import { getPublicAuthors } from "@/lib/community";

type AuthorsPageProps = {
  searchParams: Promise<{ q?: string; language?: string }>;
};

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const params = await searchParams;
  const authors = await getPublicAuthors(params.q, params.language);

  return (
    <div className="archive-page">
      <div className="section-rule">
        <span>04 / The Community</span>
        <span>Student Authors & Contributors</span>
      </div>
      <h1
        className="display"
        style={{
          fontSize: "clamp(2.6rem, 5.5vw, 5rem)",
          margin: "0.5rem 0 2rem",
        }}
      >
        Meet the writers.
      </h1>

      <form className="author-search" method="get">
        <label htmlFor="author-query">Search authors directory</label>
        <input
          id="author-query"
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, pen name, or @username…"
        />
        <select
          name="language"
          defaultValue={params.language ?? ""}
          aria-label="Filter by language"
        >
          <option value="">All languages</option>
          <option>English</option>
          <option>Malayalam</option>
          <option>Arabic</option>
          <option>Urdu</option>
        </select>
        <button className="button" type="submit">
          Search directory
        </button>
      </form>

      {authors.length === 0 ? (
        <div className="empty-editorial">
          <p className="eyebrow">Writers Roster</p>
          <h2 className="display">The community is gathering.</h2>
          <p>
            Authors with published works will appear here. Submit your writing
            to join the LAFZOON literary registry.
          </p>
          <Link className="button" href="/submit">
            Submit your work ↗
          </Link>
        </div>
      ) : (
        <div className="author-grid">
          {authors.map((author) => {
            const initial =
              author.displayName?.trim().charAt(0).toUpperCase() || "A";
            return (
              <Link
                className="author-card"
                href={`/authors/${author.username}`}
                key={author.username}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent)",
                      color: "var(--color-surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.3rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                  <div>
                    <p
                      className="eyebrow"
                      style={{ margin: 0, fontSize: "0.62rem" }}
                    >
                      {author.languages.join(" · ") || "Student Writer"}
                    </p>
                    <h2
                      className="display"
                      style={{
                        fontSize: "1.5rem",
                        margin: "0.15rem 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      {author.displayName}
                      {author.verified ? (
                        <span
                          className="verified-badge"
                          title="Verified LAFZOON writer"
                          aria-label="Verified LAFZOON writer"
                        >
                          ✓
                        </span>
                      ) : null}
                    </h2>
                  </div>
                </div>

                <p
                  className="muted"
                  style={{ fontSize: "0.78rem", margin: "0 0 0.75rem" }}
                >
                  @{author.username} · {author.publishedWorkCount}{" "}
                  {author.publishedWorkCount === 1
                    ? "published work"
                    : "published works"}
                </p>

                {author.bio ? (
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "0.95rem",
                      lineHeight: "1.55",
                      color: "var(--color-text-secondary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {author.bio}
                  </p>
                ) : null}

                <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
                  <span className="text-link" style={{ fontSize: "0.72rem" }}>
                    View profile & works ↗
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
