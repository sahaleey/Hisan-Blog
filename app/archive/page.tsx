import Link from "next/link";
import { JournalFeed } from "@/components/journal-feed";
import { getJournalWorks } from "@/lib/reader";

type ArchiveProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivePage({ searchParams }: ArchiveProps) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;
  const filters = {
    ...(value("language") ? { language: value("language") } : {}),
    ...(value("genre") ? { genre: value("genre") } : {}),
    ...(value("search") ? { search: value("search") } : {}),
    ...(value("year") ? { year: value("year") } : {}),
    ...(value("month") ? { month: value("month") } : {}),
    sort: "newest" as const,
  };
  const data = await getJournalWorks(filters);

  const hasActiveFilters = Boolean(
    filters.search || filters.year || filters.month || filters.language || filters.genre
  );

  return (
    <div className="archive-page">
      <div className="section-rule">
        <span>02 / The Archive</span>
        <span>Permanent Public Record</span>
      </div>
      <h1 className="display" style={{ fontSize: "clamp(2.6rem, 5.5vw, 5rem)", margin: "0.5rem 0 2rem" }}>
        Works worth keeping.
      </h1>

      <form className="author-search" method="get">
        <label htmlFor="archive-search">Search the permanent catalogue</label>
        <input
          id="archive-search"
          name="search"
          defaultValue={filters.search}
          placeholder="Title, writer, or phrase…"
        />
        <input
          name="year"
          inputMode="numeric"
          pattern="[0-9]{4}"
          defaultValue={filters.year}
          placeholder="Year (e.g. 2026)"
          aria-label="Filter by Year"
        />
        <select
          name="month"
          defaultValue={filters.month ?? ""}
          aria-label="Filter by Month"
        >
          <option value="">All months</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {new Date(2000, index).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          name="language"
          defaultValue={filters.language ?? ""}
          aria-label="Filter by Language"
        >
          <option value="">All languages</option>
          <option>English</option>
          <option>Malayalam</option>
          <option>Arabic</option>
          <option>Urdu</option>
        </select>
        <button className="button" type="submit">
          Search archive
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
          {filters.year ? (
            <span className="status-submitted">{filters.year}</span>
          ) : null}
          {filters.month ? (
            <span className="status-submitted">
              {new Date(2000, Number(filters.month) - 1).toLocaleString("en", { month: "short" })}
            </span>
          ) : null}
          {filters.language ? (
            <span className="status-submitted">{filters.language}</span>
          ) : null}
          <Link href="/archive" className="text-link" style={{ fontSize: "0.72rem", marginLeft: "auto" }}>
            Clear all filters
          </Link>
        </div>
      ) : null}

      {data.works.length === 0 ? (
        <div className="empty-editorial">
          <p className="eyebrow">Archive Catalogue</p>
          <h2 className="display">No published works found in this section.</h2>
          <p>
            Approved submissions will live here as a permanent, searchable
            record of the community&apos;s creative and scholarly work.
          </p>
          <Link className="text-link" href="/submit">
            Be the first contributor to this section&nbsp; ↗
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
