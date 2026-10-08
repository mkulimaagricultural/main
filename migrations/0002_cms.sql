-- Safe to run after 0001_posts.sql. Existing posts remain intact.
CREATE TABLE IF NOT EXISTS post_meta (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  deleted_at TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS post_meta_deleted_idx ON post_meta (deleted_at);
INSERT OR IGNORE INTO post_meta (post_id) SELECT id FROM posts;
