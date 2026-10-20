import Image from "next/image";

export function HisanLoadingScreen() {
  return (
    <div
      className="hisan-loading"
      role="status"
      aria-label="Loading the journal"
    >
      <div className="loading-logo" aria-hidden="true">
        <Image
          className="loading-logo-image"
          src="/images/icon.svg"
          alt=""
          width={300}
          height={212}
          priority
        />
        <span className="loading-logo-shimmer" />
      </div>
      <p className="loading-label">Loading the journal…</p>
      <span className="loading-indicator" aria-hidden="true" />
      <span className="sr-only">Please wait while journal content loads.</span>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="article-grid article-grid-standard" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="article-skeleton" key={index}>
          <div className="article-skeleton-media" />
          <div className="article-skeleton-body">
            <span
              className="skeleton-line"
              style={{ width: "30%", height: "0.65rem" }}
            />
            <span
              className="skeleton-line"
              style={{ width: "85%", height: "1.4rem", margin: "0.75rem 0" }}
            />
            <span className="skeleton-line" style={{ width: "95%" }} />
            <span className="skeleton-line" style={{ width: "70%" }} />
            <div className="skeleton-card-footer">
              <span
                className="skeleton-line"
                style={{ width: "50%", height: "0.65rem", margin: 0 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArticleReaderSkeleton() {
  return (
    <div className="reading-page" aria-hidden="true">
      <div className="skeleton-centered">
        <span
          className="skeleton-line"
          style={{ width: 120, height: "0.75rem" }}
        />
      </div>
      <div className="reader-title-skeleton">
        <span
          className="skeleton-line"
          style={{ width: "75%", height: "2.8rem" }}
        />
        <span
          className="skeleton-line"
          style={{ width: "50%", height: "2.8rem" }}
        />
      </div>
      <div className="skeleton-centered">
        <span
          className="skeleton-line"
          style={{ width: 180, height: "1rem" }}
        />
      </div>
      <div className="reading-cover article-skeleton-media" />
      <div className="reading-content reader-copy-skeleton">
        {[100, 98, 94, 65, 100, 92, 96, 45].map((width, i) => (
          <span
            className="skeleton-line"
            style={{ width: `${width}%` }}
            key={i}
          />
        ))}
      </div>
    </div>
  );
}

export function AuthorProfileSkeleton() {
  return (
    <div className="loading-profile-skeleton" aria-hidden="true">
      <div className="skeleton-circle" />
      <div className="loading-profile-copy">
        <span className="skeleton-line" style={{ width: "38%" }} />
        <span
          className="skeleton-line"
          style={{ width: "62%", height: "2rem" }}
        />
        <span className="skeleton-line" style={{ width: "80%" }} />
        <span className="skeleton-line" style={{ width: "55%" }} />
      </div>
      <ArticleGridSkeleton count={3} />
    </div>
  );
}

export function AuthorListSkeleton() {
  return (
    <div className="author-grid" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div className="article-skeleton author-loading-card" key={item}>
          <div className="skeleton-circle" />
          <span className="skeleton-line" style={{ width: "48%" }} />
          <span
            className="skeleton-line"
            style={{ width: "68%", height: "1.4rem" }}
          />
          <span className="skeleton-line" style={{ width: "90%" }} />
          <span className="skeleton-line" style={{ width: "74%" }} />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-page dashboard-loading" aria-hidden="true">
      <div className="dashboard-loading-heading">
        <span className="skeleton-line" style={{ width: "18%" }} />
        <span
          className="skeleton-line"
          style={{ width: "42%", height: "2.5rem" }}
        />
      </div>
      <div className="dashboard-loading-metrics">
        {[1, 2, 3, 4].map((item) => (
          <div className="dashboard-loading-card" key={item}>
            <span className="skeleton-line" style={{ width: "55%" }} />
            <span
              className="skeleton-line"
              style={{ width: "35%", height: "2rem" }}
            />
          </div>
        ))}
      </div>
      <div className="dashboard-loading-row">
        <span className="skeleton-line" style={{ width: "30%" }} />
        <span
          className="skeleton-line"
          style={{ width: "95%", height: "5rem" }}
        />
        <span
          className="skeleton-line"
          style={{ width: "95%", height: "5rem" }}
        />
        <span
          className="skeleton-line"
          style={{ width: "95%", height: "5rem" }}
        />
      </div>
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="admin-loading-skeleton" aria-hidden="true">
      <span
        className="skeleton-line"
        style={{ width: "34%", height: "2.3rem" }}
      />
      <span className="skeleton-line" style={{ width: "24%" }} />
      <div className="admin-loading-table">
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="skeleton-line"
            style={{ width: "100%", height: "3.6rem" }}
          />
        ))}
      </div>
    </div>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="notification-loading-list" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((item) => (
        <div className="notification-loading-row" key={item}>
          <span className="skeleton-circle" />
          <div>
            <span className="skeleton-line" style={{ width: "42%" }} />
            <span className="skeleton-line" style={{ width: "78%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
