import { NextResponse } from "next/server";
import { imageUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const key = (await params).key.join("/");
  if (!key || key.includes("..") || !key.startsWith("works/")) {
    return NextResponse.json({ error: "Invalid asset key." }, { status: 400 });
  }
  try {
    const response = await fetch(await imageUrl(key), {
      next: { revalidate: 300 },
    });
    if (!response.ok || !response.body)
      return new NextResponse(null, { status: 404 });
    return new NextResponse(response.body, {
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Asset delivery is unavailable." },
      { status: 503 },
    );
  }
}
