-- Additive authenticated view identity.
-- Anonymous viewer_key events remain supported by the existing policy.

ALTER TABLE work_views
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES authors(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS work_views_authenticated_unique_idx
  ON work_views (work_id, author_id)
  WHERE author_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS work_views_author_idx
  ON work_views (author_id, created_at DESC)
  WHERE author_id IS NOT NULL;
