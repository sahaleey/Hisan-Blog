-- HISAN community foundation.
-- Apply after 001_initial.sql. This migration is additive and preserves works.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE account_role AS ENUM ('author', 'editor', 'moderator', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated');
CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'removed');
CREATE TYPE notification_type AS ENUM (
  'new_follower',
  'new_comment',
  'submission_update',
  'publication'
);
CREATE TYPE report_status AS ENUM ('open', 'resolved', 'dismissed');

ALTER TABLE authors
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS role account_role NOT NULL DEFAULT 'author',
  ADD COLUMN IF NOT EXISTS status account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE authors
SET username = lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9_]+', '-', 'g'))
WHERE username IS NULL;

UPDATE authors
SET username = concat('author-', left(id::text, 8))
WHERE username IS NULL OR username = '';

ALTER TABLE authors
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS authors_username_idx ON authors (lower(username));
CREATE INDEX IF NOT EXISTS authors_status_idx ON authors (status);

CREATE TABLE IF NOT EXISTS author_profiles (
  author_id UUID PRIMARY KEY REFERENCES authors(id) ON DELETE CASCADE,
  bio TEXT CHECK (char_length(bio) <= 500),
  avatar_url TEXT,
  location TEXT CHECK (char_length(location) <= 120),
  website_url TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id);

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
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status comment_status NOT NULL DEFAULT 'visible',
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
  type notification_type NOT NULL,
  work_id UUID REFERENCES works(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON notifications (recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  status report_status NOT NULL DEFAULT 'open',
  moderator_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  moderator_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(work_id, comment_id, profile_id) = 1)
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS user_preferences (
  author_id UUID PRIMARY KEY REFERENCES authors(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  comment_notifications BOOLEAN NOT NULL DEFAULT true,
  follower_notifications BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_tokens_lookup_idx
  ON auth_tokens (token_hash, purpose)
  WHERE used_at IS NULL;
