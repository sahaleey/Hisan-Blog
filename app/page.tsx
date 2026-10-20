import Link from "next/link";
import { getHomeWorks } from "@/lib/reader";
import { Reveal } from "@/components/reveal";
import { HomeCarousel } from "@/components/home-carousel";
import { ArticleGrid } from "@/components/article-grid";

export default async function HomePage() {
  const { featured, popular } = await getHomeWorks();

  return (
    <>
      <section className="hero">
        <Reveal>
          <p className="eyebrow">A Multilingual Student Literary Journal</p>
          <h1 className="display">Make room for the voice.</h1>
        </Reveal>
        <Reveal className="hero-intro" delay={100}>
          <p>
            HISAN BLOG is a student-led publication for stories, poetry, essays,
            and philosophical inquiry in the languages we live, dream, and write
            in.
          </p>
          <Link className="text-link" href="/submit">
            Submit your work&nbsp; ↗
          </Link>
        </Reveal>
      </section>

      <section className="section">
        <div className="section-rule">
          <span>01 / The Journal</span>
          <span>HISAN NRIC · 2026</span>
        </div>
        <Reveal className="empty-editorial">
          <p className="eyebrow">A Living Student Archive</p>
          <h2 className="display">
            Every archive begins with an honest sentence.
          </h2>
          <p>
            The journal gathers original writing from the HISAN community across
            Malayalam, Arabic, Urdu, English, and the many literary forms
            between them. Read slowly. Return often. Discover new voices from
            our campus.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <Link className="text-link" href="/journal">
              Enter the journal&nbsp; ↗
            </Link>
            <Link
              className="text-link"
              href="/authors"
              style={{
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border-strong)",
              }}
            >
              Meet the writers&nbsp; ↗
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="section" style={{ marginTop: "4rem" }}>
        <div className="section-rule">
          <span>02 / Featured Writing</span>
          <Link href="/journal">Browse complete issue ↗</Link>
        </div>
        <HomeCarousel works={featured} />
      </section>

      <section
        className="section"
        style={{ marginTop: "5.5rem", marginBottom: "4rem" }}
      >
        <div className="section-rule">
          <span>03 / Popular This Month</span>
          <span>Curated by reader engagement</span>
        </div>
        {popular.length === 0 ? (
          <div
            style={{
              padding: "3.5rem 2rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            <p className="muted" style={{ fontStyle: "italic", margin: 0 }}>
              Popularity rankings will emerge as readers explore the journal.
            </p>
          </div>
        ) : (
          <ArticleGrid works={popular} variant="compact" />
        )}
      </section>
    </>
  );
}
