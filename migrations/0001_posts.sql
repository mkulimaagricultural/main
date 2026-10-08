CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_sw TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_sw TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS posts_public_idx ON posts (status, published_at DESC);

INSERT OR IGNORE INTO posts (
  id, title_en, title_sw, body_en, body_sw, image_url, status, created_at, updated_at, published_at
) VALUES (
  'mao-founders-meeting-001',
  'Founders discuss climate-resilient agriculture',
  'Waanzilishi wajadili kilimo himilivu',
  'In an internal meeting, MAo''s founders discussed ways to support communities through climate-resilient agriculture and responses to climate change.',
  'Katika kikao cha ndani, waanzilishi wa MAo walijadili namna ya kuwasaidia wananchi kupitia kilimo himilivu na kukabiliana na mabadiliko ya tabianchi.',
  '/assets/img/founders-meeting.jpg',
  'published',
  datetime('now'), datetime('now'), datetime('now')
);
