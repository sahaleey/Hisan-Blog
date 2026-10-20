import { AuthorListSkeleton } from "@/components/loading-ui";
export default function Loading() { return <div className="archive-page"><div className="skeleton-line" aria-hidden="true" style={{ width: "32%", height: "2.5rem", margin: "3rem 0 1.5rem" }} /><AuthorListSkeleton /></div>; }
