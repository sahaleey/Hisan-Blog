-- Restore schema used by community server actions on partially migrated
-- databases. Additive only; preserves existing comments and notifications.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'like';

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS comments_parent_idx
  ON comments (parent_id)
  WHERE parent_id IS NOT NULL;
