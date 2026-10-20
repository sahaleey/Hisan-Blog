import { loadEnvConfig } from "@next/env";
import { sql } from "@vercel/postgres";

loadEnvConfig(process.cwd());
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
if (!email) throw new Error("Set BOOTSTRAP_ADMIN_EMAIL to the verified Google email.");

const existing = await sql`SELECT 1 FROM authors WHERE role = 'admin' LIMIT 1`;
if (existing.rowCount) throw new Error("An administrator already exists; refusing to bootstrap another.");

const result = await sql`
  UPDATE authors
  SET role = 'admin'::account_role, status = 'active'::account_status, updated_at = now()
  WHERE lower(email) = ${email} AND google_id IS NOT NULL
  RETURNING id
`;
if (!result.rowCount) {
  throw new Error("No Google-linked author matched. Sign in with the intended account first.");
}
console.log("Bootstrap administrator assigned to the existing Google-linked author.");
