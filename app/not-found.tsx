import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="archive-page"
      style={{ maxWidth: "800px", padding: "6rem 2rem 8rem" }}
    >
      <div
        className="section-rule"
        style={{ borderTop: "none", paddingBottom: "1rem" }}
      >
        <span>404 / Not Found</span>
        <span>LAFZOON Literary Archive</span>
      </div>
      <div className="empty-editorial" style={{ margin: "1.5rem 0" }}>
        <p className="eyebrow">Catalog Notice</p>
        <h1
          className="display"
          style={{
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            margin: "0.5rem 0 1rem",
          }}
        >
          That manuscript has wandered off.
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            lineHeight: 1.6,
            color: "var(--color-text-secondary)",
            margin: "0 0 2rem",
          }}
        >
          The work, profile, or section you are looking for is unavailable, may
          have been relocated, or has not yet entered our public issue.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link className="button" href="/">
            Return to journal home
          </Link>
          <Link className="button button-secondary" href="/journal">
            Browse published issue ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
