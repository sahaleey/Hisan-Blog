import type { JournalWork } from "@/lib/reader";
import { ArticleCard } from "@/components/article-card";

export function ArticleGrid({ works, variant = "standard" }: { works: JournalWork[]; variant?: "featured" | "standard" | "compact" }) {
  return <div className={`article-grid article-grid-${variant}`}>{works.map((work) => <ArticleCard key={work.id} work={work} variant={variant} />)}</div>;
}
