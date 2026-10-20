-- Store validated rich-text documents alongside legacy plain-text content.
-- Existing articles remain readable through the content fallback.

ALTER TABLE works
  ADD COLUMN IF NOT EXISTS content_json JSONB;
