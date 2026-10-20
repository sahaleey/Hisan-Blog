import Image from "next/image";
import Link from "next/link";
import type { JournalWork } from "@/lib/reader";

function getLangCode(language: string) {
  switch (language) {
    case "Arabic": return "ar";
    case "Urdu": return "ur";
    case "Malayalam": return "ml";
    default: return "en";
  }
}

export function ArticleCard({
  work,
  variant = "standard",
}: {
  work: JournalWork;
  variant?: "featured" | "standard" | "compact";
}) {
  const rtl = work.language === "Arabic" || work.language === "Urdu";
  const langCode = getLangCode(work.language);
  const formattedDate = new Date(work.published_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      className={`article-card article-card-${variant}`}
      dir={rtl ? "rtl" : "ltr"}
      lang={langCode}
      data-language={work.language}
    >
      <Link className="article-card-link" href={`/journal/${work.slug}`}>
        <div className="article-card-media">
          {work.image_url ? (
            <Image
              src={work.image_url}
              alt={work.image_alt ?? ""}
              fill
              sizes={
                variant === "featured"
                  ? "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 880px"
                  : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 440px"
              }
            />
          ) : (
            <span className="article-card-fallback" aria-hidden="true">
              {work.language === "Arabic"
                ? "ح"
                : work.language === "Malayalam"
                  ? "ഹി"
                  : work.language === "Urdu"
                    ? "ح"
                    : "H"}
            </span>
          )}
        </div>
        <div className="article-card-body">
          <p className="eyebrow">
            {work.language} · {work.genre}
          </p>
          <h2>{work.title}</h2>
          {work.excerpt ? <p className="muted">{work.excerpt}</p> : null}
          <div className="article-card-meta">
            <span>By {work.author_name}</span>
            <span> · </span>
            <span>{formattedDate}</span>
            <span> · </span>
            <span>{work.view_count} views</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
