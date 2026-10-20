CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE work_status AS ENUM ('draft', 'submitted', 'published', 'rejected');

CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES authors(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('English', 'Malayalam', 'Arabic', 'Urdu')),
  genre TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  status work_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX works_published_at_idx ON works (published_at DESC) WHERE status = 'published';
CREATE INDEX works_language_idx ON works (language);
