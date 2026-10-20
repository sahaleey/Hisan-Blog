-- Restore the reader view table on databases where 005_reader_community.sql
-- was not applied. Additive and idempotent; preserves existing data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS work_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_views_work_created_idx
  ON work_views (work_id, created_at DESC);

-- Keep anonymous viewer events compatible with the original implementation.
-- The timestamp allows a viewer to be counted again after the API's 24-hour window.
CREATE UNIQUE INDEX IF NOT EXISTS work_views_recent_viewer_idx
  ON work_views (work_id, viewer_key, created_at);
