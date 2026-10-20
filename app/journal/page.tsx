import Link from "next/link";
import { JournalFeed } from "@/components/journal-feed";
import { getJournalWorks } from "@/lib/reader";

type JournalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;
  const filters = {
    ...(value("language") ? { language: value("language") } : {}),
    ...(value("genre") ? { genre: value("genre") } : {}),
    ...(value("search") ? { search: value("search") } : {}),
    sort: value("sort") === "popular" ? "popular" : "newest",
  } as const;
  const data = await getJournalWorks(filters);

  const hasActiveFilters = Boolean(
    filters.search || filters.language || filters.genre || filters.sort !== "newest"
  );

  return (
    <div className="archive-page">
      <div className="section-rule">
        <span>01 / The Journal</span>
        <span>Living Index of Published Works</span>
      </div>
      <h1 className="display" style={{ fontSize: "clamp(2.6rem, 5.5vw, 5rem)", margin: "0.5rem 0 2rem" }}>
        Read slowly. Return often.
      </h1>

      <form className="author-search" method="get">
        <label htmlFor="journal-search">Search by title, writer, or phrase</label>
        <input
          id="journal-search"
          name="search"
          defaultValue={filters.search}
          placeholder="Search the journal…"
        />
        <select
          name="language"
          defaultValue={filters.language ?? ""}
          aria-label="Filter by language"
        >
          <option value="">All languages</option>
          <option>English</option>
          <option>Malayalam</option>
          <option>Arabic</option>
          <option>Urdu</option>
        </select>
        <select
          name="sort"
          defaultValue={filters.sort}
          aria-label="Sort articles"
        >
          <option value="newest">Newest first</option>
          <option value="popular">Most read</option>
        </select>
        <button className="button" type="submit">
          Apply filters
        </button>
      </form>

      {hasActiveFilters ? (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
          <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Active filters:
          </span>
          {filters.search ? (
            <span className="status-submitted" style={{ textTransform: "none" }}>
              &ldquo;{filters.search}&rdquo;
            </span>
          ) : null}
          {filters.language ? (
            <span className="status-submitted">{filters.language}</span>
          ) : null}
          {filters.sort === "popular" ? (
            <span className="status-submitted">Popular</span>
          ) : null}
          <Link href="/journal" className="text-link" style={{ fontSize: "0.72rem", marginLeft: "auto" }}>
            Clear all filters
          </Link>
        </div>
      ) : null}

      {data.works.length === 0 ? (
        <div className="empty-editorial">
          <p className="eyebrow">Index Query</p>
          <h2 className="display">No published works match your current criteria.</h2>
          <p>
            Try adjusting your search terms or selecting &ldquo;All languages&rdquo; to browse the wider journal.
          </p>
          <Link className="button button-secondary" href="/journal">
            Reset all filters
          </Link>
        </div>
      ) : (
        <JournalFeed
          initialWorks={data.works}
          initialCursor={data.nextCursor}
          initialHasMore={data.hasMore}
          filters={filters}
        />
      )}
    </div>
  );
}
