"use client";

import { useEffect, useState, useCallback } from "react";
import type { JournalWork } from "@/lib/reader";
import { ArticleCard } from "@/components/article-card";

export function HomeCarousel({ works }: { works: JournalWork[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setIndex((current) => (current + 1) % works.length);
  }, [works.length]);

  const prevSlide = useCallback(() => {
    setIndex((current) => (current - 1 + works.length) % works.length);
  }, [works.length]);

  useEffect(() => {
    if (works.length < 2 || isPaused) return;
    const timer = window.setInterval(nextSlide, 8000);
    return () => window.clearInterval(timer);
  }, [works.length, isPaused, nextSlide]);

  if (!works.length) {
    return (
      <div className="carousel-empty">
        <p>Featured writing will appear here after editorial review.</p>
      </div>
    );
  }

  const work = works[index];

  return (
    <div
      className="home-carousel"
      aria-roledescription="carousel"
      aria-label="Featured writing"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") prevSlide();
        if (event.key === "ArrowRight") nextSlide();
      }}
      tabIndex={0}
      role="region"
    >
      <ArticleCard work={work} variant="featured" />
      {works.length > 1 ? (
        <div className="carousel-controls">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prevSlide}
          >
            ←
          </button>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--color-text-secondary)",
              padding: "0 0.5rem",
            }}
          >
            {String(index + 1).padStart(2, "0")} / {String(works.length).padStart(2, "0")}
          </span>
          {works.map((item, itemIndex) => (
            <button
              type="button"
              key={item.id}
              aria-label={`Go to slide ${itemIndex + 1}`}
              aria-current={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
              style={{
                width: "8px",
                height: "8px",
                minWidth: "8px",
                minHeight: "8px",
                padding: 0,
                borderRadius: "50%",
                background: itemIndex === index ? "var(--color-accent)" : "var(--color-border-strong)",
                border: "none",
              }}
            />
          ))}
          <button
            type="button"
            aria-label="Next slide"
            onClick={nextSlide}
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
