-- HISAN reader and community features.
-- Additive only: preserves existing authors, works, follows, reports, and audit logs.

CREATE TABLE IF NOT EXISTS work_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_views_work_created_idx
  ON work_views (work_id, created_at DESC);

CREATE TABLE IF NOT EXISTS likes (
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (author_id, work_id)
);

CREATE INDEX IF NOT EXISTS likes_work_idx ON likes (work_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden', 'removed')),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_work_visible_idx
  ON comments (work_id, created_at DESC)
  WHERE status = 'visible';

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  work_id UUID REFERENCES works(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE works
  ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS works_featured_idx
  ON works (featured_at DESC)
  WHERE status = 'published' AND featured_at IS NOT NULL;
