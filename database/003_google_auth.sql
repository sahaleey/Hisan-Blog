ALTER TABLE authors
  ADD COLUMN IF NOT EXISTS google_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS authors_google_id_idx
  ON authors (google_id)
  WHERE google_id IS NOT NULL;
