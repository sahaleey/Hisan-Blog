import { sql } from "@vercel/postgres";

type GoogleAuthorInput = {
  googleId: string;
  email: string;
  displayName: string;
};

export async function ensureAuthorForGoogleAccount(input: GoogleAuthorInput) {
  if (!process.env.POSTGRES_URL) {
    throw new Error("Database configuration is missing.");
  }

  const username = `google-${input.googleId.slice(0, 12).toLowerCase()}`;
  try {
    const result = await sql<{ id: string; role: string }>`
      INSERT INTO authors (google_id, display_name, email, username)
      VALUES (${input.googleId}, ${input.displayName.trim()}, ${input.email}, ${username})
      ON CONFLICT (google_id) WHERE google_id IS NOT NULL DO UPDATE
      SET display_name = EXCLUDED.display_name,
          email = EXCLUDED.email,
          updated_at = now()
      RETURNING id, role
    `;
    const author = result.rows[0];
    if (!author) throw new Error("Unable to create the author account.");
    return author;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("This email is already linked to an existing author account.");
    }
    throw error;
  }
}

export async function getAuthorById(id: string) {
  if (!process.env.POSTGRES_URL) return null;
  const result = await sql<{ id: string; status: string; role: string }>`
    SELECT id, status, role
    FROM authors
    WHERE id = ${id}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
