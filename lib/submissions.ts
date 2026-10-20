"use server";

import { randomUUID } from "node:crypto";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { auth } from "@/auth";
import type { SubmissionState } from "@/lib/submission-state";
import { isRichTextDocument, plainTextFromDocument } from "@/lib/rich-text";
import { deleteImage, uploadImage, validateImage } from "@/lib/storage";

const languages = ["English", "Malayalam", "Arabic", "Urdu"] as const;

const submissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(180, "Title is too long."),
  genre: z
    .string()
    .trim()
    .min(1, "Genre is required.")
    .max(80, "Genre is too long."),
  language: z.enum(languages, { message: "Choose a supported language." }),
  excerpt: z.string().trim().max(500, "Excerpt is too long."),
  content: z.string().trim().max(100000, "Your work is too long."),
});

export async function submitWork(
  _previousState: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const session = await auth();
  const authorId = session?.user?.id;
  if (!authorId) {
    return {
      status: "error",
      message: "Sign in with Google before submitting your work.",
    };
  }
  if (!process.env.POSTGRES_URL) {
    return {
      status: "error",
      message: "The submission service is temporarily unavailable.",
    };
  }

  const parsed = submissionSchema.safeParse({
    title: formData.get("title"),
    genre: formData.get("genre"),
    language: formData.get("language"),
    excerpt: formData.get("excerpt") || "",
    content: formData.get("content") || "",
  });
  const rawDocument = formData.get("content_json");
  const coverImage = formData.get("cover_image");
  const imageAlt = String(formData.get("image_alt") || "").trim();
  let contentDocument: unknown = null;
  if (typeof rawDocument === "string" && rawDocument) {
    try {
      contentDocument = JSON.parse(rawDocument);
    } catch {
      return {
        status: "error",
        message: "Your formatted work could not be read. Please try again.",
      };
    }

    if (!isRichTextDocument(contentDocument)) {
      console.error(
        "[submitWork] Invalid rich-text document:",
        JSON.stringify(contentDocument).slice(0, 5000),
      );

      return {
        status: "error",
        message: "Your formatted work contains unsupported content.",
      };
    }
  }
  let validatedImage: Awaited<ReturnType<typeof validateImage>> | undefined;
  if (coverImage instanceof File && (coverImage.size > 0 || coverImage.name)) {
    try {
      validatedImage = await validateImage(coverImage);
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Invalid cover image.",
      };
    }
    if (!imageAlt)
      return {
        status: "error",
        message: "Add alternative text for the cover image.",
        fieldErrors: { content: "Cover image alternative text is required." },
      };
  }
  if (!parsed.success) {
    const fieldErrors: SubmissionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "title" ||
        field === "genre" ||
        field === "language" ||
        field === "excerpt" ||
        field === "content"
      ) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }
  if (contentDocument)
    parsed.data.content = plainTextFromDocument(contentDocument);
  if (!parsed.data.content.trim()) {
    return {
      status: "error",
      message: "Your work is required.",
      fieldErrors: { content: "Your work is required." },
    };
  }

  const slug = `${slugify(parsed.data.title)}-${randomUUID().slice(0, 8)}`;
  try {
    const result = await sql`
      INSERT INTO works (
        id, author_id, title, slug, language, genre, excerpt, content, content_json, status, submitted_at
      )
      SELECT
        gen_random_uuid(), a.id, ${parsed.data.title}, ${slug}, ${parsed.data.language},
        ${parsed.data.genre}, NULLIF(${parsed.data.excerpt}, ''), ${parsed.data.content},
        ${contentDocument ? JSON.stringify(contentDocument) : null}::jsonb,
        'submitted'::work_status, now()
      FROM authors a
      WHERE a.id = ${authorId} AND a.status = 'active'
      RETURNING id
    `;
    if (result.rowCount !== 1) {
      return {
        status: "error",
        message: "Your author account could not be verified.",
      };
    }
    const workId = result.rows[0]?.id as string;
    if (coverImage instanceof File && validatedImage) {
      const objectKey = `works/${authorId}/${workId}/${randomUUID()}${validatedImage?.extension ?? ""}`;
      try {
        await uploadImage(objectKey, coverImage, validatedImage);
        await sql`
          INSERT INTO article_images (work_id, object_key, alt_text, content_type, file_size)
          VALUES (${workId}, ${objectKey}, ${imageAlt}, ${validatedImage?.contentType}, ${validatedImage?.bytes.length})
        `;
      } catch {
        await deleteImage(objectKey).catch(() => undefined);
        return {
          status: "error",
          message:
            "The work was saved, but the cover image could not be stored.",
        };
      }
    }
    return {
      status: "success",
      message: "Your work was sent for editorial review.",
    };
  } catch {
    return {
      status: "error",
      message: "We could not save your work. Please try again.",
    };
  }
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "work"
  );
}
