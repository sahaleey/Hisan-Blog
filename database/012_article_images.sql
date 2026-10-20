-- Stable metadata for cover images stored in the private Neon assets bucket.
CREATE TABLE IF NOT EXISTS article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL CHECK (char_length(alt_text) BETWEEN 1 AND 240),
  caption TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS article_images_work_idx
  ON article_images (work_id);
