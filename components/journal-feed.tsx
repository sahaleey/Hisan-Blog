"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JournalWork } from "@/lib/reader";
import { ArticleGrid } from "@/components/article-grid";
import { ArticleGridSkeleton } from "@/components/loading-ui";

type Props = {
  initialWorks: JournalWork[];
  initialCursor: string | null;
  initialHasMore: boolean;
  filters: Record<string, string | undefined>;
};

export function JournalFeed({ initialWorks, initialCursor, initialHasMore, filters }: Props) {
  const [works, setWorks] = useState<JournalWork[]>(initialWorks);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !cursor) return;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ cursor });
      for (const [key, value] of Object.entries(filters)) {
        if (value) query.set(key, value);
      }
      const response = await fetch(`/api/journal?${query}`);
      if (!response.ok) throw new Error("Unable to load more works.");
      const next = (await response.json()) as {
        works: JournalWork[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      setWorks((current) => {
        const ids = new Set(current.map((work) => work.id));
        return [...current, ...next.works.filter((work) => !ids.has(work.id))];
      });
      setCursor(next.nextCursor);
      setHasMore(next.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load more works.");
    } finally {
      setLoading(false);
    }
  }, [cursor, filters, hasMore, loading]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "500px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <ArticleGrid works={works} />
      <div ref={sentinel} aria-live="polite" className="feed-status">
        {loading ? (
          <div style={{ width: "100%", marginTop: "2rem" }}>
            <p className="muted" style={{ marginBottom: "1.5rem" }}>
              Gathering more writing from the archive…
            </p>
            <ArticleGridSkeleton count={3} />
          </div>
        ) : null}
        {error ? (
          <div>
            <p className="form-error" style={{ marginBottom: "1rem" }}>
              {error}
            </p>
            <button className="button button-secondary" onClick={() => void loadMore()}>
              Try again ↺
            </button>
          </div>
        ) : null}
        {!loading && !error && !hasMore && works.length > 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <span style={{ color: "var(--color-accent)", fontSize: "1.4rem" }}>— ❦ —</span>
            <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              You have reached the end of this index.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
