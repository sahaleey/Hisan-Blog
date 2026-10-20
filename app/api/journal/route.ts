import { NextRequest, NextResponse } from "next/server";
import { getJournalWorks } from "@/lib/reader";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sort = params.get("sort") === "popular" ? "popular" : "newest";
  const data = await getJournalWorks({
    language: params.get("language") ?? undefined,
    genre: params.get("genre") ?? undefined,
    search: params.get("search") ?? undefined,
    sort,
    cursor: params.get("cursor") ?? undefined,
  });
  return NextResponse.json(data);
}
