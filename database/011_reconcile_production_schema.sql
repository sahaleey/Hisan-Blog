-- Reconcile objects used by the admin and editorial workflows when earlier
-- migrations were only partially applied. Additive only; existing state is
-- intentionally preserved.

ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'blocked';
ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'reviewing';

ALTER TABLE authors
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_note TEXT,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

ALTER TABLE works
  ADD COLUMN IF NOT EXISTS editorial_feedback TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES authors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS authors_verified_idx
  ON authors (verified_at DESC)
  WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;
