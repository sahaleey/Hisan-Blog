import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getComments,
  getPublishedWork,
  getWorkInteractionState,
} from "@/lib/reader";
import { auth } from "@/auth";
import { WorkInteractions } from "@/components/work-interactions";
import { ViewTracker } from "@/components/view-tracker";
import { RichTextContent } from "@/components/rich-text-content";
import { isRichTextDocument } from "@/lib/rich-text";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = await getPublishedWork((await params).slug);
  return work
    ? {
        title: `${work.title} — LAFZOON`,
        description: work.excerpt ?? undefined,
      }
    : {};
}

function getLangCode(language: string) {
  switch (language) {
    case "Arabic":
      return "ar";
    case "Urdu":
      return "ur";
    case "Malayalam":
      return "ml";
    default:
      return "en";
  }
}

export default async function JournalWorkPage({ params }: Props) {
  const work = await getPublishedWork((await params).slug);
  if (!work) notFound();

  const session = await auth();
  const comments = await getComments(work.id);
  const interaction = await getWorkInteractionState(work.id, session?.user?.id);

  const rtl = work.language === "Arabic" || work.language === "Urdu";
  const langCode = getLangCode(work.language);
  const formattedDate = new Date(work.published_at).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <article
      className="reading-page"
      lang={langCode}
      data-language={work.language}
    >
      <ViewTracker workId={work.id} />

      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          alignItems: "center",
          fontSize: "0.72rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-text-secondary)",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/journal" style={{ color: "var(--color-accent)" }}>
          The Journal
        </Link>
        <span>/</span>
        <span>{work.language}</span>
        <span>/</span>
        <span>{work.genre}</span>
      </nav>

      <p className="eyebrow">
        {work.language} · {work.genre}
      </p>

      <h1 className="display article-title" dir={rtl ? "rtl" : "ltr"}>
        {work.title}
      </h1>

      <p className="reading-byline">
        By{" "}
        <Link href={`/authors/${work.author_username}`}>
          {work.author_name}
        </Link>
        {work.author_verified ? (
          <span
            className="verified-badge"
            title="Verified LAFZOON writer"
            aria-label="Verified LAFZOON writer"
          >
            ✓
          </span>
        ) : null}
      </p>

      <p className="reading-meta">
        Published {formattedDate} · {work.view_count}{" "}
        {work.view_count === 1 ? "reader" : "readers"}
      </p>

      {work.image_url ? (
        <figure style={{ margin: "2.5rem 0 3.5rem" }}>
          <div className="reading-cover" style={{ margin: 0 }}>
            <Image
              src={work.image_url}
              alt={work.image_alt ?? work.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 860px"
            />
          </div>
          {work.image_alt ? (
            <figcaption
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                textAlign: "center",
                marginTop: "0.65rem",
              }}
            >
              {work.image_alt}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {work.excerpt ? (
        <div className="reading-excerpt" dir={rtl ? "rtl" : "auto"}>
          &ldquo;{work.excerpt}&rdquo;
        </div>
      ) : null}

      <div className="reading-content" dir={rtl ? "rtl" : "auto"}>
        {isRichTextDocument(work.content_json) ? (
          <RichTextContent document={work.content_json} />
        ) : (
          (work.content ?? "")
            .split(/\r?\n/)
            .filter((p) => p.trim().length > 0)
            .map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "4rem 0 2rem",
        }}
      >
        <span style={{ color: "var(--color-accent)", fontSize: "1.4rem" }}>
          — ❦ —
        </span>
      </div>

      <WorkInteractions
        workId={work.id}
        authorId={work.author_id ?? ""}
        currentAuthorId={session?.user?.id}
        initialLikeCount={work.like_count}
        initialLiked={interaction.liked}
        initialFollowing={interaction.following}
        comments={comments}
      />
    </article>
  );
}
