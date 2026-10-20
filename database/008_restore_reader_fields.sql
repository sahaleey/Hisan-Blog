-- Restore reader fields required by the homepage on databases where the
-- reader-community migration was only partially applied.

ALTER TABLE works
  ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS works_featured_idx
  ON works (featured_at DESC)
  WHERE status = 'published' AND featured_at IS NOT NULL;
