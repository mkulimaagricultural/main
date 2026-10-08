-- Add ordered photo/video attachments while preserving the legacy posts.image_url cover.
CREATE TABLE IF NOT EXISTS post_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  UNIQUE (post_id, position)
);
CREATE INDEX IF NOT EXISTS post_media_post_idx ON post_media (post_id, position);

-- Backfill the original image on existing posts only once.
INSERT INTO post_media (post_id, position, media_url, media_type)
SELECT p.id, 0, p.image_url, 'image'
FROM posts p
WHERE p.image_url <> ''
  AND NOT EXISTS (SELECT 1 FROM post_media pm WHERE pm.post_id = p.id);
