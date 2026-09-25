CREATE TABLE IF NOT EXISTS assessment_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL,
  form_id TEXT,
  language TEXT,
  profile_label TEXT,
  literacy_score REAL,
  fluency_score REAL,
  mindset_score REAL,
  overall_score REAL,
  raw_payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
